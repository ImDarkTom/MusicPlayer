const fs = require('fs');
const path = require('path');
const ID3 = require('node-id3');

const acceptedFileTypes = [".mp3", ".wav", ".ogg", ".aac"];

const musicFolderPath = path.join(__dirname, '..', 'music');
const dbFolderPath = path.join(__dirname, 'database');

const musicDBPath = path.join(dbFolderPath, 'music.json');

//Metadata
function processUploadMetadata(fileName) {
    const filePath = path.join(musicFolderPath, fileName);

    const tags = ID3.read(filePath);

    if (!tags.title) {
        tags.title = fileName;
    }

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

function getFileID3(fileName, excludeImage = true, excludeRaw = true) {
    const filePath = path.join(musicFolderPath, fileName);

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

function getMetadata(fileName) {
    const musicDB = getDB('music.json');

    const foundItem = musicDB.find(item => item.file.filename === fileName)

    return foundItem;
}

//DB
function getDB(fileName) {
    const filePath = path.join(dbFolderPath, fileName);

    try {

        const file = fs.readFileSync(filePath);
        return JSON.parse(file.toString());

    } catch (err) {

        // If file doesn't exist create empty array for file
        if (err.code === "ENOENT") {
            fs.writeFileSync(filePath, "[]");
            return [];
        } else {
            throw err;
        }
        
    }
}

function updateDBInfo() {
    const files = fs.readdirSync(musicFolderPath).filter(file => acceptedFileTypes.includes(path.extname(file).toLowerCase()));

    const musicDB = getDB('music.json');

    if (files.length == musicDB.length) {
        console.log("✅ DB unchanged.");
        return;
    }

    console.log("🔄 Updating DB with new files...");

    const data = [];

    for (const file of files) {
        const tags = getFileID3(file, false);

        if (tags.image) {
            const imageBuffer = tags.image.imageBuffer;

            fs.writeFileSync(path.join(dbFolderPath, 'images', `${file}.png`), imageBuffer);
        }

        const stats = fs.statSync(path.join(musicFolderPath, file));
        const uploadTime = stats.mtimeMs;

        const title = tags.title ? tags.title : file;
        const artist = tags.artist ? tags.artist : "Unknown Artist";
        const album = tags.album ? tags.album : "Unknown Album";

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

    fs.writeFileSync(musicDBPath, JSON.stringify(data), {encoding:'utf8',flag:'w'});

    console.log("✅ Finished DB update");
}

module.exports = {
    getMetadata,
    processUploadMetadata,
    updateDBInfo,
    getDB
}