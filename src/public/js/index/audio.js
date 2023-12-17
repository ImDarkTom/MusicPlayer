import * as icons from '../icons.js'
import { Song } from '../playlists.js';
import { sendMessage } from '../utils/sendPostMessage.js';
import { getFavsList, setLocalStorageData } from '../utils/storage.js'

// Selectors
const SELECTORS = {
    playingAudio: 'audio#playing',
    musicBar: 'div#music-bar',
    songCover: 'img#bar-album-cover',
    artistText: 'p#bar-artist',
    songNameText: 'p#bar-title',
    loopBtn: 'button#loop-song',
    favBtn: 'button#fav-song',
    nextTrackBtn: 'button#next-track',
    prevTrackBtn: 'button#prev-track',
    playPauseBtn: 'button#play-pause',
    volumeSlider: 'input#volume-slider',
    volumeButton: 'button#volume',
    seekSlider: 'input#seek-slider',
    audioDuration: 'p#audioduration',
    audioCurrent: 'p#audiocurrent',
    contextMenu: 'div#song-context-menu',
};

const select = (selector) => document.querySelector(selector);
const playingAudio = select(SELECTORS.playingAudio);
const musicBar = select(SELECTORS.musicBar);
const songCover = select(SELECTORS.songCover);
const artistText = select(SELECTORS.artistText);
const songNameText = select(SELECTORS.songNameText);
const loopBtn = select(SELECTORS.loopBtn);
const favBtn = select(SELECTORS.favBtn);
const nextTrackBtn = select(SELECTORS.nextTrackBtn);
const prevTrackBtn = select(SELECTORS.prevTrackBtn);
const playPauseBtn = select(SELECTORS.playPauseBtn);
const volumeSlider = select(SELECTORS.volumeSlider);
const volumeButton = select(SELECTORS.volumeButton);
const seekSlider = select(SELECTORS.seekSlider);
const audioDuration = select(SELECTORS.audioDuration);
const audioCurrent = select(SELECTORS.audioCurrent);
const contextMenu = select(SELECTORS.contextMenu);

const hasMediaSession = navigator.mediaSession == undefined ? false : true;

let playlist = [];
let playlistIndex = 0;

//Listeners
//audio bar
favBtn.addEventListener('click', async () => {
    const playingSong = playingAudio.dataset.filename;
    const favsList = getFavsList();
    const filesList = favsList.map((item) => item.file.filename);

    if (filesList.includes(playingSong)) {
        const updatedFavs = favsList.filter(item => item.file.filename !== playingSong);

        setLocalStorageData('favourites', updatedFavs);

        favBtn.innerHTML = icons.heartOutline;
        return;
    }

    const response = await fetch(`/details/${playingSong}`);
    const info = await response.json();

    favsList.unshift(info);

    setLocalStorageData('favourites', favsList);

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

nextTrackBtn.addEventListener('click', () => {loadNextTrack()});

if (hasMediaSession) {
    navigator.mediaSession.setActionHandler('previoustrack', () => {loadPrevTrack()});

    navigator.mediaSession.setActionHandler('nexttrack', () => {loadNextTrack()});

    navigator.mediaSession.setActionHandler('seekto', (details) => {
        playingAudio.currentTime = details.seekTime;
    });    
}

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

function playSong(songObject) {
    const filename = songObject.file.filename;
    playingAudio.src = "/song/" + filename;
    playingAudio.dataset.filename = filename;
    playingAudio.play();
    loadSongMetaData(filename);
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

async function loadSongMetaData(songObject) {
    const favsList = getFavsList();

    const response = await fetch(`/details/${fileName}`);
    const data = await response.json();

    const meta = data.meta;
    const title = meta.title;
    const artist = meta.artist;
    const album = meta.album;

    const imagePath = `/details/${fileName}/image`;

    const favFiles = favsList.map((item) => item.file.filename);

    if (favFiles.includes(fileName)) {
        favBtn.innerHTML = icons.heartFilled;;
    } else {
        favBtn.innerHTML = icons.heartOutline;;
    }
    
    songCover.src = imagePath;
    artistText.textContent = artist;
    songNameText.textContent = title;
    
    if (album == "Unknown Album") {
        songNameText.onclick = "";
    } else {
        songNameText.onclick = function() { sendMessage(["LOAD_WINDOW", { page: "album", data: album }]) };
    }

    document.title = `${title} | Music Player`

    if (navigator.mediaSession != undefined) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: title,
            artist: artist,
            album: album,
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

document.onclick = function() {
    contextMenu.classList.remove('enabled');
}

songCover.oncontextmenu = function(e) {
    e.preventDefault();

    contextMenu.classList.add('enabled');
    contextMenu.style.top = (e.clientY - contextMenu.offsetHeight) + "px";
    contextMenu.style.left = e.clientX + "px";
}

export {
    playSong,
    loadPlaylist
}

setAudioVolume();