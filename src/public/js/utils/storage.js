function getLocalStorageData(key, fallback) {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
}

export function setLocalStorageData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

export function getFavsList() {
    return getLocalStorageData('favourites', []);
}