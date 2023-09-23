function getFavsList() {
    const favs = localStorage.getItem('favourites');
    return favs ? JSON.parse(favs) : [];
}

function getPlayLists() {
    const playlists = localStorage.getItem('playlists');
    return playlists ? JSON.parse(playlists) : [];
}

async function savePlaylist(id) {
    const playlists = getPlayLists();

    const ids = playlists.map(item => item.id);

    if (ids.includes(id)) {
        playlists.splice(ids.indexOf(id), 1);
        localStorage.setItem('playlists', JSON.stringify(playlists));
        alert("Removed playlist from saved.")
        return;
    }

    const response = await fetch(`/api/playlist/${id}`);
    const json = await response.json();

    playlists.push({
        name: json.metadata.title,
        id: id
    });

    localStorage.setItem('playlists', JSON.stringify(playlists));
    alert("Saved playlist");
}

export {
    getPlayLists,
    getFavsList,
    savePlaylist
}