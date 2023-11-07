import { sendMessage } from "../utils/sendPostMessage.js";

const select = (selector) => document.querySelector(selector);
const songListCardTemplate = select('template#song-list-card-template');
const recentUploadsList = select('ul#recent-uploads');
const favsSongsList = select('ul#fav-songs');

function getFavsList() {
    const favs = localStorage.getItem('favourites');
    return favs ? JSON.parse(favs) : [];
}

function createCard(songInfo) {
    const clone = songListCardTemplate.content.cloneNode(true);

    const baseElement = clone.querySelector('li');
    const titleElement = clone.querySelector('p.title');
    const artistElement = clone.querySelector('p.artist');
    const imageElement = clone.querySelector('img');

    const filename = songInfo.file.filename;
    const artist = songInfo.meta.artist;
    const title = songInfo.meta.title;
    const album = songInfo.meta.album;

    baseElement.onclick = function () { sendMessage(["PLAY_SONG", filename]); };

    titleElement.textContent = title;
    titleElement.title = title;

    artistElement.textContent = artist;
    artistElement.title = artist;

    imageElement.src = `/details/${filename}/image`;
    imageElement.title = album;

    return clone;
}

async function updateSongListFormat(storageKey, fileList) {
    //Turns list of files into list of metadata
    const newList = [];

    for (const file of fileList) {
        const response = await fetch(`/details/${file}`);
        const songDetails = await response.json();

        const artist = songDetails.artist;
        const title = songDetails.title;
        const album = songDetails.album;

        const item = {
            file: {
                filename: file,
            },
            meta: {
                title: title,
                artist: artist,
                album: album,
            }
        }

        newList.push(item);
    }

    localStorage.setItem(storageKey, JSON.stringify(newList));
}

async function loadSuggested() {
    //Favs
    let favsList = getFavsList();

    if (favsList.length == 0) {
        const helpText = "Press the ♡ button while playing a song to add it to your favourites.";

        const clone = document.createElement('li');

        const titleElement = clone.querySelector('p.title');
        const imageElement = clone.querySelector('img');


        titleElement.textContent = helpText;
        titleElement.classList.add("help-card-text");
        titleElement.classList.remove("title");
        titleElement.title = helpText;

        imageElement.height = 0;

        favsSongsList.appendChild(clone);
    } 

    if (typeof favsList[0] == "string") {
        await updateSongListFormat('favourites', favsList);

        favsList = getFavsList();
    }

    for (const favInfo of favsList) {
        const card = createCard(favInfo);

        favsSongsList.appendChild(card);
    }

    //Recents
    const response = await fetch(`/api/recents`);
    const songInfoList = await response.json();

    for (const songInfo of songInfoList) {
        const card = createCard(songInfo);

        recentUploadsList.appendChild(card);
    }
}

loadSuggested();