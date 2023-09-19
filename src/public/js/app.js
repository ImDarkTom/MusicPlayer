import { playSong } from './index/audio.js'

const trackName = new URL(window.location.href).searchParams.get("track");

if (trackName) {
    const fileName = atob(trackName);
    playSong(fileName);
}

//Listeners
window.addEventListener('message', (event) => {
    const [action, param] = event.data;
    
    if (action == "PLAY_SONG") {
        playSong(param);
        return;
    }
    
}, false);