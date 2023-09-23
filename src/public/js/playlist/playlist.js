import { sendMessage } from "../utils/sendPostMessage.js"
import { savePlaylist } from "../utils/storage.js";

const select = (selector) => document.querySelector(selector);
const title = select("h1#title");
const table = select('table#list');

const saveButton = select('button#save-playlist');

const itemTemplate = select('template#item-tem');

const hash = window.location.hash.replace('#', '');

saveButton.addEventListener('click', (e) => {
    savePlaylist(hash);
});

async function loadPlayList(id) {
    const response = await fetch(`api/playlist/${id}`)
    const data = await response.json();

    const playlistFiles = data.items.map(item => item.filename)

    title.textContent = data.metadata.title;

    for (const songIndex in data.items) {
        const songData = data.items[songIndex];

        const clone = itemTemplate.content.cloneNode(true);

        const baseElement = clone.querySelector('tr.song-item');

        baseElement.onclick = function() { sendMessage(["PLAY_SONG", songData.filename]) };
        
        baseElement.querySelector('td.item-index').textContent = Number(songIndex) + 1;
        baseElement.querySelector('td.item-title').innerHTML = `<img src="/details/${songData.filename}/image"><span>${songData.title}</span>`;
        baseElement.querySelector('td.item-artist').textContent = songData.artist;
        baseElement.querySelector('td.item-length').textContent = songData.length;


        table.appendChild(baseElement);
    }

    sendMessage(["LOAD_PLAYLIST", {list: playlistFiles, index: 0}]);
}

loadPlayList(hash);