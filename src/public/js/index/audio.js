import * as icons from '../icons.js'
import { getFavsList } from '../utils/storage.js'
import { showPopupWindow } from './topbar.js';

// Selectors
const select = (selector) => document.querySelector(selector);
const playingAudio = select('audio#playing');

const musicBar = select('div#music-bar')

const songCover = select('img#bar-album-cover');
const artistText = select('p#bar-artist');
const songNameText = select('p#bar-title');

const loopBtn = select('button#loop-song');
const favBtn = select('button#fav-song');
const nextTrackBtn = select('button#next-track');
const prevTrackBtn = select('button#prev-track');

const playPauseBtn = select('button#play-pause');

const volumeSlider = select('input#volume-slider');
const volumeButton = select('button#volume');

const seekSlider = select('input#seek-slider');
const audioDuration = select("p#audioduration");

const audioCurrent = select('p#audiocurrent');

const contextMenu = select('div#song-context-menu');
const saveToPlaylistBtn = select('li#add-to-playlist');

const hasMediaSession = navigator.mediaSession == undefined ? false : true;

let playlist = [];
let playlistIndex = 0;

//Listeners
//audio bar
favBtn.addEventListener('click', () => {
    const playingSong = playingAudio.dataset.filename;
    const favsList = getFavsList();

    if (favsList.includes(playingSong)) {
        const updatedFavs = favsList.filter(item => item !== playingSong);

        localStorage.setItem('favourites', JSON.stringify(updatedFavs));

        favBtn.innerHTML = icons.heartOutline;
        return;
    }

    favsList.unshift(playingAudio.dataset.filename);

    localStorage.setItem('favourites', JSON.stringify(favsList));

    favBtn.innerHTML = icons.heartFilled;
});


loopBtn.addEventListener('click', () => {
    if (playingAudio.loop) {
        playingAudio.loop = false;
        loopBtn.classList.remove('enabled');
    } else {
        playingAudio.loop = true;
        loopBtn.classList.add('enabled');
    }
});

prevTrackBtn.addEventListener('click', () => {loadPrevTrack()});
navigator.mediaSession.setActionHandler('previoustrack', () => {loadPrevTrack()});

nextTrackBtn.addEventListener('click', () => {loadNextTrack()});
navigator.mediaSession.setActionHandler('nexttrack', () => {loadNextTrack()});

//other
playingAudio.addEventListener('play', () => {
    playPauseBtn.innerHTML = icons.pause;
    if (hasMediaSession) {
        navigator.mediaSession.playbackState = 'playing';
    }
});

playingAudio.addEventListener('pause', () => {
    playPauseBtn.innerHTML = icons.play;
    if (hasMediaSession) {
        navigator.mediaSession.playbackState = 'paused';
    }
});

playingAudio.addEventListener('volumechange', () => {
    if (playingAudio.muted || playingAudio.volume === 0.00) {
        volumeButton.textContent = "🔇";
    } else {
        volumeButton.textContent = "🔊";
    }
});

playingAudio.addEventListener('ended', function () {
    if (hasMediaSession) {
        navigator.mediaSession.playbackState = 'none';
    }
    loadNextTrack();
});

playingAudio.addEventListener('timeupdate', () => {
    seekSlider.value = Math.round(playingAudio.currentTime);
    audioCurrent.textContent = calculateTime(seekSlider.value)

    if (hasMediaSession) {
        navigator.mediaSession.setPositionState({
            duration: seekSlider.max,
            playbackRate: playingAudio.playbackRate,
            position: Math.round(playingAudio.currentTime)
        });
    }
});

playingAudio.addEventListener('loadedmetadata', () => {
    const songDuration = Math.round(playingAudio.duration);
    audioDuration.textContent = calculateTime(songDuration);
    seekSlider.setAttribute('max', songDuration);
});

playPauseBtn.addEventListener('click', () => {
    if (playingAudio.paused) {
        playingAudio.play();
    } else {
        playingAudio.pause();
    }
});

volumeButton.addEventListener('click', () => {
    playingAudio.muted = !playingAudio.muted;
});

volumeSlider.addEventListener('input', () => {
    playingAudio.volume = volumeSlider.value / 100;
})

seekSlider.addEventListener('input', () => {
    playingAudio.currentTime = seekSlider.value;
});


//Functions
function calculateTime(secs) {
    const minutes = Math.floor(secs / 60);
    const seconds = Math.round(secs % 60);
    const returnedSecs = seconds < 10 ? `0${seconds}` : seconds;

    return `${minutes}:${returnedSecs}`;
};

function setAudioVolume() {
    playingAudio.volume = (volumeSlider.value / 100);
}

function playSong(fileName) {
    playingAudio.src = "/song/" + fileName;
    playingAudio.dataset.filename = fileName;
    playingAudio.play();
    loadSongMetaData(fileName);
}

function loadPlaylist(list, index) {
    playlist = list;
    playlistIndex = index;
}

function loadNextTrack() {
    if (playlist.length == 0) {
        return;
    }

    playlistIndex = (playlistIndex + 1) % playlist.length;
    playSong(playlist[playlistIndex]);
}

function loadPrevTrack() {
    if (playlist.length == 0) {
        return;
    }

    playlistIndex = (playlistIndex - 1 + playlist.length) % playlist.length;
    playSong(playlist[playlistIndex]);
}

async function loadSongMetaData(fileName) {
    const favsList = getFavsList();

    const response = await fetch(`/details/${fileName}`);
    const data = await response.json();

    const imagePath = `/details/${fileName}/image`;

    if (favsList.includes(fileName)) {
        favBtn.innerHTML = icons.heartFilled;;
    } else {
        favBtn.innerHTML = icons.heartOutline;;
    }
    
    songCover.src = imagePath;
    artistText.textContent = data.artist;
    songNameText.textContent = data.title;
    document.title = `${data.title} | Music Player`

    if (navigator.mediaSession != undefined) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: data.title,
            artist: data.artist,
            album: data.album,
            artwork: [
                {
                    src: imagePath,
                    type: "image/jpeg"
                }
            ]
        });
    }
    

    musicBar.style["background-image"] = `url("${imagePath}")`;
}

songCover.addEventListener('click', async () => {
    if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) {
        musicBar.classList.toggle('fullscreen-info');
        return;
    }

    document.startViewTransition(() => {
        musicBar.classList.toggle('fullscreen-info');
    });
    
});

document.onclick = function(e) {
    contextMenu.classList.remove('enabled');
}

songCover.oncontextmenu = function(e) {
    e.preventDefault();

    contextMenu.classList.add('enabled');
    contextMenu.style.top = (e.clientY - contextMenu.offsetHeight) + "px";
    contextMenu.style.left = e.clientX + "px";
}

saveToPlaylistBtn.addEventListener('click', (e) => {
    if (!playingAudio.dataset.filename) {
        alert('No song is playing.')
        return;
    }

    showPopupWindow(`save-to-playlist.html#${playingAudio.dataset.filename}`);
});

export {
    playSong,
    loadPlaylist
}

setAudioVolume();