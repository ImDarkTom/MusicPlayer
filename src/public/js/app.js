import { playSong, loadPlaylist } from './index/audio.js'

const mainIframe = document.querySelector('iframe#main-window');

const trackName = new URL(window.location.href).searchParams.get("track");
const hash = window.location.hash.replace('#', '').split("-");

function loadWindow(page, params = "") {
    if (page == "") {
        mainIframe.src = "/home.html";
        window.location.hash = "";
        return;
    }

    mainIframe.src = `/${page}.html#${params}`;
    window.location.hash = `${page ? "#" + page: ""}${params ? "-" + params: ""}`;
}

if (hash) {
    const validPages = ["home", "playlist"];
    if (validPages.includes(hash[0])) {
        loadWindow(hash[0], hash[1])
    }

}

if (trackName) {
    const fileName = atob(trackName);
    playSong(fileName);
}

//Listeners
window.addEventListener('message', async (event) => {
    const [action, param] = event.data;
    
    if (action == "PLAY_SONG") {
        playSong(param);
        return;
    }

    if (action == "LOAD_PLAYLIST") {
        loadPlaylist(param.list, param.index);
        return;
    }

    if (action == "LOAD_WINDOW") {
        loadWindow(param.page, param.data);
        return;
    }

    if (action == "CREATE_PLAYLIST") {
        const playlistName = prompt("Playlist name (leave blank for default): ");

        const playlistPassword = prompt("Playlist password: ");

        if (!playlistPassword) {
            alert("Password not set, cancelled playlist creation.")
            return;
        }

        const response = await fetch(`/api/playlist_create?title=${playlistName ? playlistName: "My Playlist"}&password=${playlistPassword}`);
        const json = await response.json();

        loadWindow('playlist', json.id);
    }
    
}, false);

window.onhashchange = function() {
    const hash = window.location.hash.replace('#', '').split('-');
    loadWindow(hash[0], hash[1]);
};