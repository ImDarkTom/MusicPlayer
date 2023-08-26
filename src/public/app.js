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
const searchResults = document.querySelector('datalist#song-search-results');

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

searchBox.addEventListener('keyup', async (e) => {
    if (e.key == "Enter") {
        playSong(searchBox.value);
        return;
    }

    const response = await fetch(`/search?q=${searchBox.value}`);
    const results = await response.json();

    searchResults.innerHTML = "";

    for (const result of results) {
        const option = document.createElement('option');
        option.value = result;
        option.textContent = result;

        searchResults.appendChild(option);
    }
});

async function loadSongMetaData(fileName) {
    const response = await fetch(`/details/${fileName}`);
    const data = await response.json();

    let imageUrl;

    if (data.image) {
        const base64Image = data.image.imageBuffer;
        const binaryString = atob(base64Image);
        const imageArrayBuffer = new ArrayBuffer(binaryString.length);
        const imageUint8Array = new Uint8Array(imageArrayBuffer);

        for (let i = 0; i < binaryString.length; i++) {
            imageUint8Array[i] = binaryString.charCodeAt(i);
        }

        const imageBlob = new Blob([imageArrayBuffer], { type: 'image/jpeg' });
        imageUrl = URL.createObjectURL(imageBlob);
    } else {
        imageUrl = "/img/noimage.jpg";
    }
    
    songCover.src = imageUrl;
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