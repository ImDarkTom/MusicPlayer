const fs = require('fs');
const path = require('path');
const ID3 = require('node-id3');

const acceptedFileTypes = [".mp3", ".wav", ".ogg", ".aac"];

const musicFolderPath = path.join(__dirname, '..', 'music');
const dbFolderPath = path.join(__dirname, 'database');

const getDBFilePath = (fileName) => path.join(dbFolderPath, fileName);

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
    const filePath = getDBFilePath(fileName);

    try {

        const file = fs.readFileSync(filePath);
        return JSON.parse(file.toString());

    } catch (err) {
        //If file doesnt exist
        if (err.code === "ENOENT") {
            fs.writeFileSync(filePath, "[]");
            return [];
        } else {
            throw err;
        }

    }
}

function updateDBInfo() {
    const musicFiles = fs.readdirSync(musicFolderPath).filter(file => acceptedFileTypes.includes(path.extname(file).toLowerCase()));

    const musicDB = getDB('music.json');

    if (musicFiles.length == musicDB.length) {
        console.log("✅ DB unchanged.");
        return;
    }

    console.log("🔄 Updating DB with new files...");

    //Update music database
    const albumDB = getDB('albums.json');

    const mappedMusicDBFiles = musicDB.map((song) => song.file.filename)

    for (const fileName of musicFiles) {
        if (mappedMusicDBFiles.includes(fileName)) {
            continue;
        }

        const tags = getFileID3(fileName, false);

        const metadataImage = tags.image;
        if (metadataImage) {
            const imageBuffer = metadataImage.imageBuffer;

            fs.writeFileSync(path.join(dbFolderPath, 'images', `${fileName}.png`), imageBuffer);
        }

        const fileStats = fs.statSync(path.join(musicFolderPath, fileName));
        const lastModifiedTime = fileStats.mtimeMs; 

        const songTitle = tags.title ? tags.title : fileName;
        const songArtist = tags.artist ? tags.artist : "Unknown Artist";
        const songAlbum = tags.album ? tags.album : "Unknown Album";

        const item = {
            file: {
                filename: fileName,
                uploadtime: lastModifiedTime,
            },
            meta: {
                title: songTitle,
                artist: songArtist,
                album: songAlbum
            }
        }

        musicDB.push(item);

        //Update album db
        if (songAlbum == "Unknown Album") {
            continue;
        }
        
        const albumInDB = albumDB.find(album => album.name === songAlbum);

        if (albumInDB) {
            albumInDB.tracks.push(fileName);
        } else {
            const newAlbum = {
                name: songAlbum,
                tracks: [fileName],
            };

            albumDB.push(newAlbum);
        }
    }

    const updateDBFile = (dbFileName, updatedData) => fs.writeFileSync(getDBFilePath(dbFileName), JSON.stringify(updatedData), {encoding:'utf8',flag:'w'});
    
    updateDBFile('music.json', musicDB);
    updateDBFile('albums.json', albumDB);

    console.log("✅ Finished DB update");
}

module.exports = {
    getMetadata,
    processUploadMetadata,
    updateDBInfo,
    getDB
}