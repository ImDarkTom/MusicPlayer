import { playSong } from './audio.js'

// Selectors
const select = (selector) => document.querySelector(selector);

const searchBox = select('input#search');
const searchResults = select('ul#search-results');
const searchResultTemplate = select('template#search-result-template');

const playingAudio = select('audio#playing');

const menuBtn = select('button#menu');
const dropdownList = select('ul#dropdown-menu');

const uploadBtn = select('li#upload-btn');

const popupWindowBg = select('div#popup-window-background');

const shareSongBtn = document.querySelector('li#share-song');

const nonInputKeys = ["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Enter"];


//Listeners
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
    document.addEventListener('click', function (event) {
        //If clicked on result
        if (event.target.matches("input#search, .result-song-title, .result-song-artist, .result-album-cover, .search-results, .result-text-info")) {
            return;
        }

        searchResults.style.display = "none";
    })
});

searchBox.addEventListener('focus', () => {
    searchResults.style.display = "block";
});

menuBtn.addEventListener('click', () => {
    if (dropdownList.style.display == "block") {
        dropdownList.style.display = "none";
    } else {
        dropdownList.style.display = "block";
    }
});

uploadBtn.addEventListener('click', () => {
    showPopupWindow("upload.html");
});

popupWindowBg.addEventListener('click', (e) => {
    if (e.target.id = "popup-window-background") { 
        popupWindowBg.style.display = "none";
    }
});

shareSongBtn.addEventListener('click', () => {
    const playingSongFile = playingAudio.dataset.filename;

    if (!playingSongFile) {
        alert("You are not currently playing anything.")
        return;
    }

    const textToCopy = `${window.location.origin}?track=${btoa(encodeURIComponent(playingSongFile))}`;

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

export function showPopupWindow(url) {
    popupWindowBg.querySelector('iframe#popup-frame').src = `/${url}`;
    popupWindowBg.style.display = "block";
}

export function closePopupWindow() {
    popupWindowBg.style.display = "none";
}