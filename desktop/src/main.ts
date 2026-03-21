import { app, BrowserWindow, ipcMain, session } from "electron";
import path from "node:path";
import { MpvManager } from "./mpv-manager";

const DEV_SERVER_URL = "http://localhost:3000";
let mainWindow: BrowserWindow | null = null;
let mpvManager: MpvManager | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 500,
    backgroundColor: "#141414",
    title: "Shinobi",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
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
  ipcMain.handle("mpv:spawn", async (_event, options: { streamUrl: string; startTime?: number }) => {
    if (!mainWindow) return;

    // Clean up any existing mpv instance
    if (mpvManager) {
      await mpvManager.quit().catch(() => {});
      mpvManager = null;
    }

    mpvManager = new MpvManager();
    await mpvManager.start(options.streamUrl, {
      startTime: options.startTime,
    });

    // Forward mpv property changes to the renderer
    mpvManager.on("property-change", (prop: string, value: unknown) => {
      mainWindow?.webContents.send("mpv:property-change", prop, value);
    });

    mpvManager.on("end-file", () => {
      mainWindow?.webContents.send("mpv:end-file");
    });

    // Return the initial track list
    return mpvManager.getTrackList();
  });

  ipcMain.handle("mpv:command", async (_event, command: string, ...args: unknown[]) => {
    if (!mpvManager) return;

    switch (command) {
      case "play":
        return mpvManager.play();
      case "pause":
        return mpvManager.pause();
      case "toggle-pause":
        return mpvManager.togglePause();
      case "seek":
        return mpvManager.seek(args[0] as number);
      case "seek-absolute":
        return mpvManager.seekAbsolute(args[0] as number);
      case "set-volume":
        return mpvManager.setVolume(args[0] as number);
      case "set-mute":
        return mpvManager.setMute(args[0] as boolean);
      case "set-audio-track":
        return mpvManager.setAudioTrack(args[0] as number);
      case "set-subtitle-track":
        return mpvManager.setSubtitleTrack(args[0] as number | false);
      case "get-property":
        return mpvManager.getProperty(args[0] as string);
      case "get-track-list":
        return mpvManager.getTrackList();
    }
  });

  ipcMain.handle("mpv:quit", async () => {
    if (mpvManager) {
      await mpvManager.quit().catch(() => {});
      mpvManager = null;
    }
  });

  ipcMain.handle("mpv:get-window-bounds", () => {
    if (!mainWindow) return null;
    const bounds = mainWindow.getContentBounds();
    return { width: bounds.width, height: bounds.height };
  });
}

app.whenReady().then(() => {
  // Allow loading resources from the backend
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    callback({ requestHeaders: details.requestHeaders });
  });

  registerMpvIpc();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (mpvManager) {
    mpvManager.quit().catch(() => {});
    mpvManager = null;
  }
  app.quit();
});
