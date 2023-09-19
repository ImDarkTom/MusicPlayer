import * as audioModule from './index/audio.js'
import * as topBar from './index/topbar.js'

const trackName = new URL(window.location.href).searchParams.get("track");

if (trackName) {
    const fileName = atob(trackName);
    audioModule.playSong(fileName);
}

//Listeners
window.addEventListener('message', (event) => {
    const [action, param] = event.data;
    
    if (action == "PLAY_SONG") {
        audioModule.playSong(param);
        return;
    }
    
}, false);