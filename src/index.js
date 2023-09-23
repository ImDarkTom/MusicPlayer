const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ID3 = require('node-id3');
const { getAudioDurationInSeconds } = require('get-audio-duration')

const config = require('../config.json');

const app = express();
const port = config.port;

const acceptedFileTypes = [".mp3", ".wav", ".ogg", ".aac"];

app.use(express.static(path.join(__dirname, 'public')));

function getMetadata(fileName, excludeImage = true, excludeRaw = true) {
    const filePath = path.join(__dirname, '..', 'music', fileName);

    if (!fs.existsSync(filePath)) {
        return -1;
    }

    const metadata = ID3.read(filePath);

    if (metadata === -1) {
        return -1;
    }

    if (!metadata.title) {
        metadata.title = fileName;
    }

    if (metadata.image && excludeImage) {
        metadata.image = "";
    }

    if (metadata.raw && excludeRaw) {
        metadata.raw = "";
    }

    return metadata;
}

async function processMetadata(fileName) {
    const filePath = path.join(__dirname, '..', 'music', fileName);

    const tags = ID3.read(filePath);

    const duration = await getAudioDurationInSeconds(filePath);

    tags.comment = [{ language: 'eng', text: String(calculateTime(Math.round(duration))) }];

    if (!tags.artist) {
        tags.artist = "Unknown Artist";
    }

    if (!tags.album) {
        tags.album = "Unknown Album";
    }

    const success = NodeID3.write(tags, fileName);

    return success;
}

function getPlaylists() {
    const filePath = path.join(__dirname, '..', 'data', 'playlists.json');

    const fileData = fs.readFileSync(filePath);
    const playlistData = JSON.parse(fileData);

    return playlistData;
}

function updatePlaylists(json) {
    fs.writeFileSync(path.join(__dirname, '..', 'data', 'playlists.json'), JSON.stringify(json));
    return;
}

function calculateTime(secs) {
    const minutes = Math.floor(secs / 60);
    const seconds = Math.round(secs % 60);
    const returnedSecs = seconds < 10 ? `0${seconds}` : seconds;

    return `${minutes}:${returnedSecs}`;
};

app.get('/details/:fileName', (req, res) => {
    const metadata = getMetadata(req.params.fileName);

    if (metadata === -1) {
        res.status(404);
    }

    res.json(metadata);
});

app.get('/details/:fileName/image', (req, res) => {
    const rawMetadata = getMetadata(req.params.fileName, false);

    if (!rawMetadata.image) {
        res.redirect('/img/placeholder-cover.jpg');
        return;
    }

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Length', rawMetadata.image.imageBuffer.length);
    
    res.send(rawMetadata.image.imageBuffer);
});

app.get('/song/:fileName', (req, res) => {
    const filePath = path.join(__dirname, '..', 'music', req.params.fileName);

    if (!fs.existsSync(filePath)) {
        res.status(404);
        return;
    }

    res.sendFile(filePath);
});

app.get("/search", (req, res) => {
    const query = req.query.q.toLowerCase();

    const files = fs.readdirSync(path.join(__dirname, '..', 'music')).filter(file => acceptedFileTypes.includes(path.extname(file).toLowerCase()));
    let songDetails = [];
    let fileNames = [];

    for (const file of files) {
        const tags = getMetadata(file);

        const title = tags.title;
        const artist = tags.artist;

        if (`${artist} ${title}`.toLowerCase().includes(query)) {
            songDetails.push({title: title, artist: artist});
            fileNames.push(file);
        }
    }

    res.send([songDetails, fileNames]);
});

app.get("/api/recents", (req, res) => {
    try {
        const dir = path.join(__dirname, '..', 'music');
        const files = fs.readdirSync(dir).filter( file => acceptedFileTypes.includes(path.extname(file).toLowerCase()) );

        files.sort(function (a, b) {
            return fs.statSync(path.join(dir, a)).mtime.getTime() -
                fs.statSync(path.join(dir, b)).mtime.getTime();
        });

        const latestFiles = files.slice(config.maxRecents * -1);

        let songDetails = [];
        let fileNames = [];

        for (const file of latestFiles) {
            const tags = getMetadata(file);

            songDetails.push({ title: tags.title, artist: tags.artist });
            fileNames.push(file);
        }

        res.json([songDetails.reverse(), fileNames.reverse()]);
    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

//Playlist
app.get('/api/playlist/:id', (req, res) => {
    const id = req.params.id;

    const playlists = getPlaylists();

    if (playlists[id] == undefined) {
        res.status(404);
        return;
    } 

    const playlist = playlists[id];
    playlist["password"] = undefined;

    res.json(playlists[id]);
});

app.get('/api/playlist_create', (req, res) => {
    const title = req.query.title;
    const password = req.query.password;

    if (!title || !password) {
        return res.status(400);
    }

    const timeMs = Date.now();

    const playlists = getPlaylists();

    playlists[timeMs] = {
        password: password,
        metadata: {
            title: title
        },
        items: []
    };

    updatePlaylists(playlists);

    res.status(200).json({status: 'OK', id: timeMs});
});

app.get('/api/playlist/:id/edit', (req, res) => {
    const id = req.params.id;
    const action = req.query.action;
    const password = req.query.password;

    if (!action) {
        return res.status(400);
    }

    const playlists = getPlaylists();

    if (playlists[id] == undefined) {
        return res.status(404);
    } 

    if (playlists[id].password != password) {
        return res.status(401);
    }


    if (action == "ADD_SONG") {
        const fileName = req.query.filename;

        const metadata = getMetadata(fileName, true, true);

        playlists[id].items.push({
            title: metadata.title,
            artist: metadata.artist,
            length: calculateTime(metadata.length),
            filename: fileName
        });
    }

    if (action == "REMOVE_SONG") {
        const fileName = req.query.filename;

        const itemsExcludingDeleted = playlists[id].items.filter((item) => item.filename !== fileName);

        playlists[id].items = itemsExcludingDeleted;
    }

    updatePlaylists(playlists);

    playlists[id]["password"] = undefined;

    return res.json(playlists[id]);
});

//Uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'music/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const audioFilter = function (req, file, cb) {
    const ext = path.extname(file.originalname);
    if (acceptedFileTypes.includes(ext)) {
        cb(null, true);
    }
};

const upload = multer({ storage: storage, fileFilter: audioFilter});

app.post('/upload', upload.single('file'), async (req, res) => {
    const processed = await processMetadata(req.file.originalname);

    if (processed) {
        res.status(200).json({ message: 'File uploaded successfully' });
    } else {
        res.status(500).json({error: "Error processing file"});
    }
    
});

app.listen(port, () => {
    console.log(`Application is running on port ${port}.`);
});