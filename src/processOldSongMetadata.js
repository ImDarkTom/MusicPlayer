const fs = require('fs');
const ID3 = require('node-id3');
const path = require('path');
const { getAudioDurationInSeconds } = require('get-audio-duration')

async function processMetadata(fileName) {
    const filePath = path.join(__dirname, '..', 'music', fileName);

    const tags = ID3.read(filePath);

    const duration = await getAudioDurationInSeconds(filePath);

    tags.length = Math.round(duration);

    if (!tags.artist) {
        tags.artist = "Unknown Artist";
    }

    if (!tags.album) {
        tags.album = "Unknown Album";
    }

    const success = ID3.update(tags, filePath);

    return success;
}

const files = fs.readdirSync(path.join(__dirname, '..', 'music'));

(async () => {
    for (const file of files) {
        const processed = await processMetadata(file);
    
        if (processed) {
            console.log("success for", file);
        } else {
            console.log("An error occured for", file);
        }  
    
    }
})();