import * as audioModule from './audio.js'
import * as uiModule from './ui.js'
import * as searchModule from './search.js'

const trackName = new URL(window.location.href).searchParams.get("track");

if (trackName) {
    const fileName = atob(trackName);
    audioModule.playSong(fileName);
}

//Functions
function getFavsList() {
    const favs = localStorage.getItem('favourites');
    return favs ? JSON.parse(favs) : [];
}

export {
    getFavsList,
}