const fs = require('fs');
const path = require('path');
const ID3 = require('node-id3');

const acceptedFileTypes = [".mp3", ".wav", ".ogg", ".aac"];
const infoPath = path.join(__dirname, 'database', 'info.json');

//Metadata
async function processMetadata(fileName) {
    const filePath = path.join(__dirname, '..', 'music', fileName);

    const tags = ID3.read(filePath);

    if (!tags.artist) {
        tags.artist = "Unknown Artist";
    }

    if (!tags.album) {
        tags.album = "Unknown Album";
    }

    const success = ID3.write(tags, fileName);

    updateDBInfo();

    return success;
}

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

//DB
function getDB() {
    const file = fs.readFileSync(path.join(__dirname, 'database', 'info.json'));
    const jsonData = JSON.parse(file.toString());

    return jsonData;
}

function updateDBInfo() {
    const files = fs.readdirSync(path.join(__dirname, '..', 'music')).filter(file => acceptedFileTypes.includes(path.extname(file).toLowerCase()));
    const db = getDB();

    if (files.length == db.length) {
        console.log("✅ DB unchanged.");
        return;
    }

    console.log("🔄 Updating DB with new files...");

    const data = [];

    for (const file of files) {
        const tags = getMetadata(file);

        const stats = fs.statSync(path.join(__dirname, '..', 'music', file));
        const uploadTime = stats.mtimeMs;

        const title = tags.title;
        const artist = tags.artist;
        const album = tags.album;

        const item = {
            file: {
                filename: file,
                uploadtime: uploadTime,
            },
            meta: {
                title: title,
                artist: artist,
                album: album
            }
        }

        data.push(item);
    }

    fs.writeFileSync(infoPath, JSON.stringify(data), {encoding:'utf8',flag:'w'});

    console.log("✅ Finished DB update");
}

module.exports = {
    getMetadata,
    processMetadata,
    updateDBInfo,
    getDB
}