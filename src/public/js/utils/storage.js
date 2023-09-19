function getFavsList() {
    const favs = localStorage.getItem('favourites');
    return favs ? JSON.parse(favs) : [];
}

function getPlayLists() {
    const playlists = localStorage.getItem('playlists');
    return playlists ? JSON.parse(playlists) : {};
}

export {
    getPlayLists,
    getFavsList
}