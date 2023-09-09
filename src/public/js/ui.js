import * as mainModule from './app.js'
import * as audioModule from './audio.js'

// Selectors
const select = (selector) => document.querySelector(selector);
const playingAudio = select('audio#playing');

const musicInfoBox = select('div#music-info')
const songCover = select('img#song-cover');
const artistText = select('p#song-artist');
const songNameText = select('p#song-name');

const loopBtn = select('button#loop-song');
const favBtn = select('button#fav-song');

const songListCardTemplate = select('template#song-list-card-template');
const recentUploadsList = select('ul#recent-uploads');
const favsSongsList = select('ul#fav-songs');

const menuBtn = select('button#menu');
const dropdownList = select('ul#dropdown-menu');

const uploadBtn = select('li#upload-btn');
const uploadMenuBg = select('div#upload-background');

//Listeners
favBtn.addEventListener('click', () => {
    const playingSong = playingAudio.dataset.filename;
    const favsList = mainModule.getFavsList();

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

loopBtn.addEventListener('click', () => {
    if (playingAudio.loop) {
        playingAudio.loop = false;
        loopBtn.classList.remove('enabled');
    } else {
        playingAudio.loop = true;
        loopBtn.classList.add('enabled');
    }
});


menuBtn.addEventListener('click', () => {
    if (dropdownList.style.display == "block") {
        dropdownList.style.display = "none";
    } else {
        dropdownList.style.display = "block";
    }
});

uploadBtn.addEventListener('click', () => {
    uploadMenuBg.style.display = "block";
});

uploadMenuBg.addEventListener('click', (e) => {
    if (e.target.id = "upload-background") { 
        uploadMenuBg.style.display = "none";
    }
});


//Functions
async function loadSongMetaData(fileName) {
    const favsList = mainModule.getFavsList();

    const response = await fetch(`/details/${fileName}`);
    const data = await response.json();

    const imagePath = `/details/${fileName}/image`;

    if (favsList.includes(fileName)) {
        favBtn.textContent = "❤️";
    } else {
        favBtn.textContent = "🤍";
    }
    
    songCover.src = imagePath;
    artistText.textContent = data.artist;
    songNameText.textContent = data.title;

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

    musicInfoBox.style["background-image"] = `url("${imagePath}")`;
}

async function loadSuggested() {
    //Favs
    const favsList = mainModule.getFavsList();

    for (const favName of favsList) {
        const clone = songListCardTemplate.content.cloneNode(true);

        const baseElement = clone.querySelector('li');

        const response = await fetch(`/details/${favName}`);
        const songDetails = await response.json();

        const artist = songDetails.artist;
        const title = songDetails.title;

        baseElement.onclick = function() {audioModule.playSong(favName);};
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

        baseElement.onclick = function() {audioModule.playSong(files[index]);};
        baseElement.title = `${artist} - ${title}`;
        clone.querySelector('p.title').textContent = title;
        clone.querySelector('p.artist').textContent = artist;
        clone.querySelector('img').src = `/details/${files[index]}/image`;

        recentUploadsList.appendChild(clone);
    }
}

export {
    loadSongMetaData,
}

//Initial setup
loadSuggested();