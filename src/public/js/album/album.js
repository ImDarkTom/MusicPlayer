import { sendMessage } from '../utils/sendPostMessage.js';

const albumName = decodeURI(window.location.hash.substring(1));

const select = (query) => document.querySelector(query);

const albumInfoContainer = select('#album-info');
const titleText = select('#name-text');
const yearText = select('#year-text');
const mainAlbumCover = select('#main-album-cover');

const albumTable = select('#album-table');

titleText.textContent = albumName;

let playlistData;

async function loadAlbumTable() {
    const response = await fetch(`/album/${albumName}`);
    playlistData = await response.json();
    const tracks = playlistData.tracks;

    const albumCoverUrl = `/details/${tracks[0].file.filename}/image`;

    mainAlbumCover.src = albumCoverUrl;
    albumInfoContainer.style.setProperty('background-image', `url('${albumCoverUrl}')`);
    yearText.textContent = playlistData.year;

    let trackIndex = 0;
    for (const track of tracks) {
        const trackMetadata = track.meta;
        const trackFiledata = track.file;
        const trElem = document.createElement('tr');

        trElem.onclick = function() { playSongFromAlbum(trackFiledata.filename, trackIndex) }

        const titleElem = document.createElement('td');
        titleElem.textContent = trackMetadata.title;
        trElem.appendChild(titleElem);

        const artistElem = document.createElement('td');
        artistElem.textContent = trackMetadata.artist;
        trElem.appendChild(artistElem);

        const dateElem = document.createElement('td');
        dateElem.textContent = new Date(trackFiledata.uploadtime).toLocaleDateString();
        trElem.appendChild(dateElem);

        albumTable.appendChild(trElem);

        trackIndex += 1;
    }
}

function playSongFromAlbum(filename, index) {
    sendMessage(["LOAD_PLAYLIST", {
        index: index,
        list: playlistData.tracks.map((track) => track.file.filename)
    }]);
    
    sendMessage(["PLAY_SONG", filename]);
}

loadAlbumTable();