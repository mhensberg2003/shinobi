"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const node_path_1 = __importDefault(require("node:path"));
const mpv_manager_1 = require("./mpv-manager");
const DEV_SERVER_URL = "http://localhost:3000";
let mainWindow = null;
let mpvManager = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 500,
        backgroundColor: "#141414",
        title: "Shinobi",
        autoHideMenuBar: true,
        webPreferences: {
            preload: node_path_1.default.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    mainWindow.loadURL(DEV_SERVER_URL);
    mainWindow.on("closed", () => {
        mainWindow = null;
    });
}
function registerMpvIpc() {
    electron_1.ipcMain.handle("mpv:spawn", async (_event, options) => {
        if (!mainWindow)
            return;
        // Clean up any existing mpv instance
        if (mpvManager) {
            await mpvManager.quit().catch(() => { });
            mpvManager = null;
        }
        mpvManager = new mpv_manager_1.MpvManager();
        await mpvManager.start(options.streamUrl, {
            startTime: options.startTime,
        });
        // Forward mpv property changes to the renderer
        mpvManager.on("property-change", (prop, value) => {
            mainWindow?.webContents.send("mpv:property-change", prop, value);
        });
        mpvManager.on("end-file", () => {
            mainWindow?.webContents.send("mpv:end-file");
        });
        // Return the initial track list
        return mpvManager.getTrackList();
    });
    electron_1.ipcMain.handle("mpv:command", async (_event, command, ...args) => {
        if (!mpvManager)
            return;
        switch (command) {
            case "play":
                return mpvManager.play();
            case "pause":
                return mpvManager.pause();
            case "toggle-pause":
                return mpvManager.togglePause();
            case "seek":
                return mpvManager.seek(args[0]);
            case "seek-absolute":
                return mpvManager.seekAbsolute(args[0]);
            case "set-volume":
                return mpvManager.setVolume(args[0]);
            case "set-mute":
                return mpvManager.setMute(args[0]);
            case "set-audio-track":
                return mpvManager.setAudioTrack(args[0]);
            case "set-subtitle-track":
                return mpvManager.setSubtitleTrack(args[0]);
            case "get-property":
                return mpvManager.getProperty(args[0]);
            case "get-track-list":
                return mpvManager.getTrackList();
        }
    });
    electron_1.ipcMain.handle("mpv:quit", async () => {
        if (mpvManager) {
            await mpvManager.quit().catch(() => { });
            mpvManager = null;
        }
    });
    electron_1.ipcMain.handle("mpv:get-window-bounds", () => {
        if (!mainWindow)
            return null;
        const bounds = mainWindow.getContentBounds();
        return { width: bounds.width, height: bounds.height };
    });
}
electron_1.app.whenReady().then(() => {
    // Allow loading resources from the backend
    electron_1.session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        callback({ requestHeaders: details.requestHeaders });
    });
    registerMpvIpc();
    createWindow();
    electron_1.app.on("activate", () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on("window-all-closed", () => {
    if (mpvManager) {
        mpvManager.quit().catch(() => { });
        mpvManager = null;
    }
    electron_1.app.quit();
});
//# sourceMappingURL=main.js.map