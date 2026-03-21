"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("electronAPI", {
    isElectron: true,
    mpv: {
        spawn(streamUrl, options) {
            return electron_1.ipcRenderer.invoke("mpv:spawn", { streamUrl, ...options });
        },
        play() {
            return electron_1.ipcRenderer.invoke("mpv:command", "play");
        },
        pause() {
            return electron_1.ipcRenderer.invoke("mpv:command", "pause");
        },
        togglePause() {
            return electron_1.ipcRenderer.invoke("mpv:command", "toggle-pause");
        },
        seek(seconds) {
            return electron_1.ipcRenderer.invoke("mpv:command", "seek", seconds);
        },
        seekAbsolute(seconds) {
            return electron_1.ipcRenderer.invoke("mpv:command", "seek-absolute", seconds);
        },
        setVolume(percent) {
            return electron_1.ipcRenderer.invoke("mpv:command", "set-volume", percent);
        },
        setMute(muted) {
            return electron_1.ipcRenderer.invoke("mpv:command", "set-mute", muted);
        },
        setAudioTrack(id) {
            return electron_1.ipcRenderer.invoke("mpv:command", "set-audio-track", id);
        },
        setSubtitleTrack(id) {
            return electron_1.ipcRenderer.invoke("mpv:command", "set-subtitle-track", id);
        },
        getProperty(name) {
            return electron_1.ipcRenderer.invoke("mpv:command", "get-property", name);
        },
        getTrackList() {
            return electron_1.ipcRenderer.invoke("mpv:command", "get-track-list");
        },
        quit() {
            return electron_1.ipcRenderer.invoke("mpv:quit");
        },
        onPropertyChange(callback) {
            const handler = (_event, prop, value) => {
                callback(prop, value);
            };
            electron_1.ipcRenderer.on("mpv:property-change", handler);
            return () => {
                electron_1.ipcRenderer.removeListener("mpv:property-change", handler);
            };
        },
        onEndFile(callback) {
            const handler = () => callback();
            electron_1.ipcRenderer.on("mpv:end-file", handler);
            return () => {
                electron_1.ipcRenderer.removeListener("mpv:end-file", handler);
            };
        },
    },
});
//# sourceMappingURL=preload.js.map