import * as uiModule from './ui.js'
import * as icons from './icons.js'

// Selectors
const select = (selector) => document.querySelector(selector);
const playingAudio = select('audio#playing');
const playPauseBtn = select('button#play-pause');

const volumeSlider = select('input#volume-slider');
const volumeButton = select('button#volume');

const seekSlider = select('input#seek-slider');
const audioDuration = select("p#audioduration");

const audioCurrent = select('p#audiocurrent');


//Listeners
playingAudio.addEventListener('play', () => {
    playPauseBtn.innerHTML = icons.pause;
    navigator.mediaSession.playbackState = 'playing';
});

playingAudio.addEventListener('pause', () => {
    playPauseBtn.innerHTML = icons.play;
    navigator.mediaSession.playbackState = 'paused';
});

playingAudio.addEventListener('volumechange', () => {
    if (playingAudio.muted || playingAudio.volume === 0.00) {
        volumeButton.textContent = "🔇";
    } else {
        volumeButton.textContent = "🔊";
    }
});

playingAudio.addEventListener('ended', function () {
    navigator.mediaSession.playbackState = 'none';
});

playingAudio.addEventListener('timeupdate', () => {
    seekSlider.value = Math.round(playingAudio.currentTime);
    audioCurrent.textContent = calculateTime(seekSlider.value)

    navigator.mediaSession.setPositionState({
        duration: seekSlider.max,
        playbackRate: playingAudio.playbackRate,
        position: Math.round(playingAudio.currentTime)
    });
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
    uiModule.loadSongMetaData(fileName);
}

export {
    playSong,
}

setAudioVolume();