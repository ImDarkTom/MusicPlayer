import * as audioModule from './audio.js'

// Selectors
const select = (selector) => document.querySelector(selector);
const searchBox = select('input#search');
const searchResults = select('ul#search-results');
const searchResultTemplate = select('template#search-result-template');


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


//Functions
async function listSongResults(query) {
    const response = await fetch(`/search?q=${query}`);
    const [songDetails, files] = await response.json();

    searchResults.innerHTML = "";

    for (const index in files) {
        const clone = searchResultTemplate.content.cloneNode(true);

        clone.querySelector('li').onclick = function() {audioModule.playSong(files[index]);};
        clone.querySelector('p.result-song-title').textContent = songDetails[index].title;
        clone.querySelector('p.result-song-artist').textContent = songDetails[index].artist;
        clone.querySelector('img').src = `/details/${files[index]}/image`;

        searchResults.appendChild(clone);
    }
}