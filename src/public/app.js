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
const favBtn = document.querySelector('button#fav-song');

const songListCardTemplate = document.querySelector('template#song-list-card-template');
const recentUploadsList = document.querySelector('ul#recent-uploads');
const favsSongsList = document.querySelector('ul#fav-songs');

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
    navigator.mediaSession.playbackState = 'paused';
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
    navigator.mediaSession.playbackState = 'playing';
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

searchBox.addEventListener('blur', (e) => {
    searchResults.style.display = "none";
});

searchBox.addEventListener('focus', (e) => {
    searchResults.style.display = "block";
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

function getFavsList() {
    const favs = localStorage.getItem('favourites');
    return favs ? JSON.parse(favs) : [];
}

favBtn.addEventListener('click', () => {
    const playingSong = playingAudio.dataset.filename;
    const favsList = getFavsList();

    if (favsList.includes(playingSong)) {
        const updatedFavs = favsList.filter(item => item !== playingSong);

        localStorage.setItem('favourites', JSON.stringify(updatedFavs));

        favBtn.textContent = "🤍";
        return;
    }

    favsList.unshift(playingAudio.dataset.filename);

    localStorage.setItem('favourites', JSON.stringify(favsList));

    favBtn.textContent = "❤️";
});

async function loadSongMetaData(fileName) {
    const favsList = getFavsList();

    const response = await fetch(`/details/${fileName}`);
    const data = await response.json();

    if (favsList.includes(fileName)) {
        favBtn.textContent = "❤️";
    } else {
        favBtn.textContent = "🤍";
    }
    
    songCover.src = `/details/${fileName}/image`;
    artistText.textContent = data.artist;
    songNameText.textContent = data.title;

    navigator.mediaSession.metadata = new MediaMetadata({
        title: data.title,
        artist: data.artist,
        album: data.album,
        artwork: [
            {
                src: `/details/${fileName}/image`,
                type: "image/jpeg"
            }
        ]
    });
}

function playSong(fileName) {
    playingAudio.src = "/song/" + fileName;
    playingAudio.dataset.filename = fileName;
    playingAudio.play();
    loadSongMetaData(fileName);
}

function setAudioVolume() {
    volumeText.textContent = `${volumeSlider.value}%`;
    playingAudio.volume = (volumeSlider.value / 100);
}

async function loadSuggested() {
    //Favs
    const favsList = getFavsList();

    for (const favName of favsList) {
        const clone = songListCardTemplate.content.cloneNode(true);

        const baseElement = clone.querySelector('li');

        const response = await fetch(`/details/${favName}`);
        const songDetails = await response.json();

        const artist = songDetails.artist;
        const title = songDetails.title;

        baseElement.onclick = function() {playSong(favName);};
        baseElement.title = `${artist} - ${title}`;
        clone.querySelector('p.title').textContent = title;
        clone.querySelector('p.artist').textContent = artist;
        clone.querySelector('img').src = `/details/${favName}/image`;

        favsSongsList.appendChild(clone);
    }

    //Recents
    const response = await fetch(`/api/recents`);
    const [songDetails, files] = await response.json();

    for (const index in files) {
        const clone = songListCardTemplate.content.cloneNode(true);
        
        const currentDetails = songDetails[index];
        const title = currentDetails.title;
        const artist = currentDetails.artist;

        const baseElement = clone.querySelector('li');

        baseElement.onclick = function() {playSong(files[index]);};
        baseElement.title = `${artist} - ${title}`;
        clone.querySelector('p.title').textContent = title;
        clone.querySelector('p.artist').textContent = artist;
        clone.querySelector('img').src = `/details/${files[index]}/image`;

        recentUploadsList.appendChild(clone);
    }
}

setAudioVolume();
loadSuggested();