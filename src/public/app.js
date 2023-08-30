const playingAudio = document.querySelector('audio#playing');
const audioDuration = document.querySelector("p#audioduration");
const seekSlider = document.querySelector('input#seek-slider');
const audioCurrent = document.querySelector('p#audiocurrent');
const playPauseBtn = document.querySelector('button#play-pause');
const volumeButton = document.querySelector('button#volume');
const volumeSlider = document.querySelector('input#volume-slider');
const volumeText = document.querySelector('p#volume-text');

const musicInfo = document.querySelector('div#music-info');
const songCover = document.querySelector('img#song-cover');
const artistText = document.querySelector('p#song-artist');
const songNameText = document.querySelector('p#song-name');

const searchBox = document.querySelector('input#search');
const searchResults = document.querySelector('ul#search-results');
const searchResultTemplate = document.querySelector('template#search-result-template');

const loopBtn = document.querySelector('button#loop-song');

function calculateTime(secs) {
    const minutes = Math.floor(secs / 60);
    const seconds = Math.round(secs % 60);
    const returnedSecs = seconds < 10 ? `0${seconds}` : seconds;

    return `${minutes}:${returnedSecs}`;
};

volumeButton.addEventListener('click', () => {
    playingAudio.muted = !playingAudio.muted;
});

playingAudio.addEventListener('pause', () => {
    playPauseBtn.textContent = "▶";
});

volumeSlider.addEventListener('input', () => {
    playingAudio.volume = volumeSlider.value / 100;
})

playingAudio.addEventListener('volumechange', () => {
    volumeText.textContent = `${Math.round(playingAudio.volume * 100)}%`;

    if (playingAudio.muted || playingAudio.volume === 0.00) {
        volumeButton.textContent = "🔇";
    } else {
        volumeButton.textContent = "🔊";
    }
});

playingAudio.addEventListener('play', () => {
    playPauseBtn.textContent = "⏸";
});

playPauseBtn.addEventListener('click', () => {
    if (playingAudio.paused) {
        playingAudio.play();
    } else {
        playingAudio.pause();
    }
});

seekSlider.addEventListener('input', () => {
    playingAudio.currentTime = seekSlider.value;
});

playingAudio.addEventListener('timeupdate', () => {
    seekSlider.value = Math.round(playingAudio.currentTime);
    audioCurrent.textContent = calculateTime(seekSlider.value)
});

playingAudio.addEventListener('loadedmetadata', () => {
    const songDuration = Math.round(playingAudio.duration);
    audioDuration.textContent = calculateTime(songDuration);
    seekSlider.setAttribute('max', songDuration);
});

async function listSongResults(query) {
    const response = await fetch(`/search?q=${query}`);
    const [songDetails, files] = await response.json();

    searchResults.innerHTML = "";

    for (const index in files) {
        const clone = searchResultTemplate.content.cloneNode(true);

        clone.querySelector('li').onclick = function() {playSong(files[index]);};
        clone.querySelector('p.result-song-title').textContent = songDetails[index].title;
        clone.querySelector('p.result-song-artist').textContent = songDetails[index].artist;
        clone.querySelector('img').src = `/details/${files[index]}/image`;

        searchResults.appendChild(clone);
    }
}

searchBox.addEventListener('input', (e) => {
    if (e.inputType == "insertReplacementText") {
        playSong(e.data);
        searchBox.value = "";
    }
});

const nonInputKeys = ["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Enter"];

searchBox.addEventListener('keyup', (e) => {
    if (nonInputKeys.includes(e.key)) {
        return;
    }

    if (searchBox.value.length < 2) {
        return;
    }

    listSongResults(searchBox.value);
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

async function loadSongMetaData(fileName) {
    const response = await fetch(`/details/${fileName}`);
    const data = await response.json();
    
    songCover.src = `/details/${fileName}/image`;
    artistText.textContent = data.artist;
    songNameText.textContent = data.title;
}

function playSong(fileName) {
    playingAudio.src = "/song/" + fileName;
    playingAudio.play();
    loadSongMetaData(fileName);
}

function setAudioVolume() {
    volumeText.textContent = `${volumeSlider.value}%`;
    playingAudio.volume = (volumeSlider.value / 100);
}

setAudioVolume();