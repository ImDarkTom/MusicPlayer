import { sendMessage } from '../utils/sendPostMessage.js';

const playlistData = JSON.parse(document.body.getAttribute('data-album'));

const allItems = document.querySelectorAll('#album-table tr');

allItems.forEach((item) => item.addEventListener('click', () => {
    const filename = item.getAttribute('data-filename');

    if (filename) {
        playSongFromAlbum(filename);
    }
}));

function playSongFromAlbum(filename) {
    sendMessage(["LOAD_PLAYLIST", {
        index: playlistData.tracks.findIndex(track => track.file.filename === filename),
        list: playlistData.tracks.map((track) => track.file.filename)
    }]);
    
    sendMessage(["PLAY_SONG", filename]);
}