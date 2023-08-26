const express = require('express');
const path = require('path');
const fs = require('fs');

const ID3 = require('node-id3');

const app = express();
const port = 3000;

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

    const acceptedFileTypes = [".mp3", ".wav", ".ogg", ".aac"];
    const files = fs.readdirSync(path.join(__dirname, '..', 'music')).filter(file => acceptedFileTypes.includes(path.extname(file).toLowerCase()));

    const results = files.filter(file => file.toLowerCase().includes(query));

    res.send(results);
});

app.listen(port, () => {
    console.log(`Application is running on port ${port}.`);
});