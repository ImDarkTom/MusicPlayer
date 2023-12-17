import { playSong, loadPlaylist } from './index/audio.js'

const mainIframe = document.querySelector('iframe#main-window');

const trackName = new URL(window.location.href).searchParams.get("track");
const [ hashLocation, hashArgs ] = window.location.hash.replace('#', '').split("-", 2);

function loadWindow(page, params = "") {
    if (page == "") {
        mainIframe.src = "/home";
        window.location.hash = "";
        return;
    }

    
    mainIframe.src = `/${page}/${params}`;
    window.location.hash = `#${page}-${params}`;
}

if (hashLocation) {
    loadWindow(hashLocation, hashArgs);
}

if (trackName) {
    const fileName = decodeURIComponent(atob(trackName));
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
    
}, false);

function updateEmbedWindow() {
    const hash = window.location.hash.replace('#', '').split('-');

    loadWindow(hash[0], hash[1]);
}

window.onhashchange = function() {
    updateEmbedWindow();
};