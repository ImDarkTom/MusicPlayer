//@ts-check
import { sendMessage } from "./utils/sendPostMessage.js";

export class Song {
    /**
     * 
     * @param {Object} file File info.
     * @param {string} file.filename The filename of the song.
     * @param {number} file.uploadtime Milliseconds since epoch of when the file was created.
     * @param {Object} meta Song metadata info.
     * @param {string} meta.title Title of the song.
     * @param {string} meta.artist Artist of the song.
     * @param {string} meta.album The album the song is in.
     */
    constructor(file, meta) {
        this.file = {};
        this.file.filename = file.filename;
        this.file.uploadtime = file.uploadtime;

        this.meta = {};
        this.meta.title = meta.title;
        this.meta.artist = meta.artist;
        this.meta.album = meta.album;
    }

    static deserialize(data) {
        const {file, meta} = JSON.parse(data);
        const song = new Song(file, meta);
        return song;
    }

    serialize() {
        return JSON.stringify({
            file: {
                filename: this.file.filename,
                uploadtime: this.file.uploadtime
            },
            meta: {
                title: this.meta.title,
                artist: this.meta.artist,
                album: this.meta.album
            }
        });
    }

    play() {
        sendMessage(["PLAY_SONG", this.file.filename])
    }
}

export class Playlist {
    /**
     * 
     * @param {string} title Title of the playlist.
     * @param {Song[]} songs List of songs in the playlist;
     * @param {number} index Index of currently active song in the playlist.
     */
    constructor(title, songs = [], index = 0) {
        this.title = title;
        this.songs = songs;
        this.index = index;
    }

    static loadFromLocalStorage(title) {
        const playlists = JSON.parse(localStorage.getItem('playlists')) || [];

        const playlist = playlists.filter((playlist) => playlist.title == title);

        return Playlist.deserialize(playlist);
    }

    static deserialize(data) {
        const {title, songs} = data;

        const deserializedSongs = songs.map((songData) => Song.deserialize(songData))

        const playlist = new Playlist(title, deserializedSongs);

        return playlist;
    }


    serialize() {
        return JSON.stringify({
            title: this.title,
            songs: this.songs.map((song) => song.serialize())
        });
    }

    addSong(song) {
        if (song instanceof Song) {
            this.songs.push(song);
        }
    }

    removeSong(songToRemove) {
        if (songToRemove instanceof Song) {
            this.songs = this.songs.filter((song) => song !== songToRemove);
        }
    }


}