"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("electronAPI", {
    isElectron: true,
    update: {
        download() { return electron_1.ipcRenderer.invoke("update:download"); },
        install() { return electron_1.ipcRenderer.invoke("update:install"); },
        onAvailable(callback) {
            const handler = (_event, data) => callback(data);
            electron_1.ipcRenderer.on("update:available", handler);
            return () => { electron_1.ipcRenderer.removeListener("update:available", handler); };
        },
        onDownloadProgress(callback) {
            const handler = (_event, data) => callback(data);
            electron_1.ipcRenderer.on("update:download-progress", handler);
            return () => { electron_1.ipcRenderer.removeListener("update:download-progress", handler); };
        },
        onDownloaded(callback) {
            const handler = () => callback();
            electron_1.ipcRenderer.on("update:downloaded", handler);
            return () => { electron_1.ipcRenderer.removeListener("update:downloaded", handler); };
        },
        onError(callback) {
            const handler = (_event, data) => callback(data);
            electron_1.ipcRenderer.on("update:error", handler);
            return () => { electron_1.ipcRenderer.removeListener("update:error", handler); };
        },
    },
    window: {
        minimize() { return electron_1.ipcRenderer.invoke("window:minimize"); },
        maximize() { return electron_1.ipcRenderer.invoke("window:maximize"); },
        close() { return electron_1.ipcRenderer.invoke("window:close"); },
        isMaximized() { return electron_1.ipcRenderer.invoke("window:isMaximized"); },
    },
    mpv: {
        spawn(streamUrl, options) {
            return electron_1.ipcRenderer.invoke("mpv:spawn", { streamUrl, ...options });
        },
        quit() {
            return electron_1.ipcRenderer.invoke("mpv:quit");
        },
        back() {
            return electron_1.ipcRenderer.invoke("mpv:back");
        },
        command(args) {
            return electron_1.ipcRenderer.invoke("mpv:command", args);
        },
        getProperty(name) {
            return electron_1.ipcRenderer.invoke("mpv:get-property", name);
        },
        setProperty(name, value) {
            return electron_1.ipcRenderer.invoke("mpv:set-property", name, value);
        },
        toggleFullscreen() {
            return electron_1.ipcRenderer.invoke("mpv:toggle-fullscreen");
        },
        isFullscreen() {
            return electron_1.ipcRenderer.invoke("mpv:is-fullscreen");
        },
        getTracks() {
            return electron_1.ipcRenderer.invoke("mpv:get-tracks");
        },
        onBack(callback) {
            const handler = () => callback();
            electron_1.ipcRenderer.on("mpv:back", handler);
            return () => { electron_1.ipcRenderer.removeListener("mpv:back", handler); };
        },
        onEnded(callback) {
            const handler = () => callback();
            electron_1.ipcRenderer.on("mpv:ended", handler);
            return () => {
                electron_1.ipcRenderer.removeListener("mpv:ended", handler);
            };
        },
        onProgress(callback) {
            const handler = (_event, data) => callback(data);
            electron_1.ipcRenderer.on("mpv:progress", handler);
            return () => {
                electron_1.ipcRenderer.removeListener("mpv:progress", handler);
            };
        },
    },
});
//# sourceMappingURL=preload.js.map