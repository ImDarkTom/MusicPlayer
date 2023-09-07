import * as audioModule from './audio.js'
import * as uiModule from './ui.js'
import * as searchModule from './search.js'

//Functions
function getFavsList() {
    const favs = localStorage.getItem('favourites');
    return favs ? JSON.parse(favs) : [];
}

export {
    getFavsList,
}