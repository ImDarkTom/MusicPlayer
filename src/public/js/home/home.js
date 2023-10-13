import { sendMessage } from "../utils/sendPostMessage.js";

const select = (selector) => document.querySelector(selector);
const songListCardTemplate = select('template#song-list-card-template');
const recentUploadsList = select('ul#recent-uploads');
const favsSongsList = select('ul#fav-songs');

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
        const titleElement = clone.querySelector('p.title');
        const artistElement = clone.querySelector('p.artist');

        const response = await fetch(`/details/${favName}`);
        const songDetails = await response.json();

        const artist = songDetails.artist;
        const title = songDetails.title;

        baseElement.onclick = function() {sendMessage(["PLAY_SONG", favName]);};

        titleElement.textContent = title;
        titleElement.title = title;

        artistElement.textContent = artist;
        artistElement.title = artist;

        clone.querySelector('img').src = `/details/${favName}/image`;

        favsSongsList.appendChild(clone);
    }

    //Recents
    const response = await fetch(`/api/recents`);
    const [songDetails, files] = await response.json();

    for (const index in files) {
        const clone = songListCardTemplate.content.cloneNode(true);
        
        const currentDetails = songDetails[index];
        const title = currentDetails.title;
        const artist = currentDetails.artist;

        const baseElement = clone.querySelector('li');
        const titleElement = clone.querySelector('p.title');
        const artistElement = clone.querySelector('p.artist');

        baseElement.onclick = function() {sendMessage(["PLAY_SONG", files[index]]);};

        titleElement.textContent = title;
        titleElement.title = title;

        artistElement.textContent = artist;
        artistElement.title = artist;

        clone.querySelector('img').src = `/details/${files[index]}/image`;

        recentUploadsList.appendChild(clone);
    }
}

loadSuggested();