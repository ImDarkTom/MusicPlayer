import * as mainModule from './app.js'
import * as audioModule from './audio.js'
import * as icons from './icons.js'

// Selectors
const select = (selector) => document.querySelector(selector);
const playingAudio = select('audio#playing');

const musicInfoBox = select('div#music-bar')
const songCover = select('img#bar-album-cover');
const artistText = select('p#bar-artist');
const songNameText = select('p#bar-title');

const loopBtn = select('button#loop-song');
const favBtn = select('button#fav-song');

const songListCardTemplate = select('template#song-list-card-template');
const recentUploadsList = select('ul#recent-uploads');
const favsSongsList = select('ul#fav-songs');

const menuBtn = select('button#menu');
const dropdownList = select('ul#dropdown-menu');

const uploadBtn = select('li#upload-btn');
const uploadMenuBg = select('div#upload-background');

const shareSongBtn = document.querySelector('li#share-song');

//Listeners
favBtn.addEventListener('click', () => {
    const playingSong = playingAudio.dataset.filename;
    const favsList = mainModule.getFavsList();

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

shareSongBtn.addEventListener('click', () => {
    const playingSongFile = playingAudio.dataset.filename;

    if (!playingSongFile) {
        alert("You are not currently playing anything.")
        return;
    }

    const textToCopy = `${window.location.origin}?track=${btoa(playingSongFile)}`;

    if (navigator.clipboard) {

        navigator.clipboard.writeText(textToCopy)
        .then(() => {
            alert('Song URL copied to clipboard: ' + textToCopy);
        })
        .catch(err => {
            console.error("Could not copy text", err)
        });

    } else {

        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;

        document.body.appendChild(textarea);

        textarea.select();
        textarea.setSelectionRange(0, 99999);

        document.execCommand('copy');

        document.body.removeChild(textarea);

        alert('Song URL copied to clipboard: ' + textToCopy);
    }
    
});


//Functions
async function loadSongMetaData(fileName) {
    const favsList = mainModule.getFavsList();

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