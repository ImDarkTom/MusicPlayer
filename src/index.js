const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ID3 = require('node-id3');

const app = express();
const port = 3000;

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

    if (!metadata.artist) {
        metadata.artist = "Unknown Artist";
    }

    if (!metadata.album) {
        metadata.album = "Unknown Album";
    }

    if (metadata.image && excludeImage) {
        metadata.image = "";
    }

    if (metadata.raw && excludeRaw) {
        metadata.raw = "";
    }

    return metadata;
}

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

        const latestFiles = files.slice(-15);

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

app.post('/upload', upload.single('file'), (req, res) => {
    res.status(200).json({ message: 'File uploaded successfully' });
});

app.listen(port, () => {
    console.log(`Application is running on port ${port}.`);
});