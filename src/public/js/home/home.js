import { sendMessage } from "../utils/sendPostMessage.js";
import { getPlayLists } from "../utils/storage.js";

const select = (selector) => document.querySelector(selector);
const songListCardTemplate = select('template#song-list-card-template');
const playlistCardTemplate = select('template#playlist-card-template');
const recentUploadsList = select('ul#recent-uploads');
const favsSongsList = select('ul#fav-songs');
const playlistsList = select('ul#playlists-list');

function getFavsList() {
    const favs = localStorage.getItem('favourites');
    return favs ? JSON.parse(favs) : [];
}

async function loadSuggested() {
    //Favs
    const favsList = getFavsList();

    for (const favName of favsList) {
        const clone = songListCardTemplate.content.cloneNode(true);

        const baseElement = clone.querySelector('li');

        const response = await fetch(`/details/${favName}`);
        const songDetails = await response.json();

        const artist = songDetails.artist;
        const title = songDetails.title;

        baseElement.onclick = function() {sendMessage(["PLAY_SONG", favName]);};
        baseElement.title = `${artist} - ${title}`;
        clone.querySelector('p.title').textContent = title;
        clone.querySelector('p.artist').textContent = artist;
        clone.querySelector('img').src = `/details/${favName}/image`;

        favsSongsList.appendChild(clone);
    }

    //Playlists
    const playlists = getPlayLists();

    for (const playlist of playlists) {
        const clone = playlistCardTemplate.content.cloneNode(true);
        
        const title = playlist.name;
        const id = playlist.id;

        const baseElement = clone.querySelector('li');

        baseElement.onclick = function() { sendMessage(["LOAD_WINDOW", {page: "playlist", data: id}]); };
        clone.querySelector('p.title').textContent = title;
        clone.querySelector('img').src = `/img/placeholder-cover.jpg`;

        playlistsList.appendChild(clone);
    }

    const clone = playlistCardTemplate.content.cloneNode(true);

    const baseElement = clone.querySelector('li');

    baseElement.onclick = function () { sendMessage(["CREATE_PLAYLIST", null]); };
    clone.querySelector('p.title').textContent = "Create a new playlist";
    clone.querySelector('img').src = `/img/placeholder-cover.jpg`;

    playlistsList.appendChild(clone);

    //Recents
    const response = await fetch(`/api/recents`);
    const [songDetails, files] = await response.json();

    for (const index in files) {
        const clone = songListCardTemplate.content.cloneNode(true);
        
        const currentDetails = songDetails[index];
        const title = currentDetails.title;
        const artist = currentDetails.artist;

        const baseElement = clone.querySelector('li');

        baseElement.onclick = function() { sendMessage(["PLAY_SONG", files[index]]); };
        baseElement.title = `${artist} - ${title}`;
        clone.querySelector('p.title').textContent = title;
        clone.querySelector('p.artist').textContent = artist;
        clone.querySelector('img').src = `/details/${files[index]}/image`;

        recentUploadsList.appendChild(clone);
    }
}

loadSuggested();