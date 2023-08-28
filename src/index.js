const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ID3 = require('node-id3');

const app = express();
const port = 3000;

const acceptedFileTypes = [".mp3", ".wav", ".ogg", ".aac"];

app.use(express.static(path.join(__dirname, 'public')));

app.get('/details/:fileName', async (req, res) => {
    const filePath = path.join(__dirname, '..', 'music', req.params.fileName);

    if (!fs.existsSync(filePath)) {
        res.status(404);
        return;
    }

    const tags = ID3.read(filePath);

    if (!tags.title) {
        tags.title = req.params.fileName;
    }

    if (!tags.artist) {
        tags.artist = "Unknown Artist";
    }

    if (!tags.album) {
        tags.album = "Unknown Album";
    }

    if (tags.image) {
        tags.image.imageBuffer = tags.image.imageBuffer.toString('base64');
    }

    res.json(tags);
});

app.get('/song/:fileName', async (req, res) => {
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

    const results = files.filter(file => file.toLowerCase().includes(query));

    res.send(results);
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