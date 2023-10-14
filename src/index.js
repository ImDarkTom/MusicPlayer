const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./database.js');

const config = require('../config.json');

const app = express();
const port = config.port;

const acceptedFileTypes = [".mp3", ".wav", ".ogg", ".aac"];

app.use(express.static(path.join(__dirname, 'public')));

app.get('/details/:fileName', (req, res) => {
    const metadata = db.getMetadata(req.params.fileName);

    if (metadata === -1) {
        res.status(404);
    }

    res.json(metadata);
});

app.get('/details/:fileName/image', (req, res) => {
    const rawMetadata = db.getMetadata(req.params.fileName, false);

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
        const tags = db.getMetadata(file);

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
        const songInfo = db.getDB();

        songInfo.sort((a, b) => b.file.uploadtime - a.file.uploadtime);

        res.json(songInfo);
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

app.post('/upload', upload.single('file'), async (req, res) => {
    const processed = await db.processMetadata(req.file.originalname);

    if (processed) {
        res.status(200).json({ message: 'File uploaded successfully' });
    } else {
        res.status(500).json({error: "Error processing file"});
    }
    
});

db.updateDBInfo();

app.listen(port, () => {
    console.log(`Application is running on port ${port}.`);
});