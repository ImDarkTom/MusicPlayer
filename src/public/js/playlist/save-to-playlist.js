import { getPlayLists } from "../utils/storage.js";

const select = (query) => document.querySelector(query);

const dropdown = select('select');;
const saveButton = select('button#save');
const passwordBox = select('input#password');

const playlists = getPlayLists();

for (const playlist of playlists) {
    const elem = document.createElement('option');
    elem.value = playlist.id;
    elem.textContent = playlist.name;

    dropdown.appendChild(elem);
}

saveButton.addEventListener('click', async () => {
    const selectedOpt = dropdown.value;

    if (selectedOpt === "") {
        return;
    }

    const response = fetch(`/api/playlist/${selectedOpt}/edit?action=ADD_SONG&filename=${window.location.hash.substring(1)}&password=${passwordBox.value}`);
    const status = (await response).status;

    switch (status) {
        case 200:
            alert('Added to playlist.');
            break;
        
        case 401:
            alert('Incorrect password.');
            break;

        case 403:
            alert('Playlist not found.');
            break;

        default:
            alert("Unknown response");
    }
});