import { app, BrowserWindow, dialog, ipcMain, session } from "electron";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { MpvManager } from "./mpv-manager";

const DEV_SERVER_URL = "http://localhost:3000";
const CONFIG_PATH = path.join(app.getPath("userData"), "shinobi-config.json");
let mainWindow: BrowserWindow | null = null;
let mpvManager: MpvManager | null = null;
let mpvPath = "mpv";

function loadConfig(): Record<string, string> {
  try {
    if (existsSync(CONFIG_PATH)) {
      return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
    }
  } catch {}
  return {};
}

function saveConfig(config: Record<string, string>) {
  try {
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  } catch {}
}

function findMpvOnPath(): boolean {
  try {
    const cmd = process.platform === "win32" ? "where" : "which";
    execFileSync(cmd, ["mpv"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

async function resolveMpvPath(): Promise<string | null> {
  // Check saved config first
  const config = loadConfig();
  if (config.mpvPath && existsSync(config.mpvPath)) {
    return config.mpvPath;
  }

  // Check PATH
  if (findMpvOnPath()) {
    return "mpv";
  }

  // Ask user to locate it
  const dialogOptions = {
    title: "Locate mpv",
    message: "mpv was not found on your PATH. Please locate mpv.exe.",
    filters: process.platform === "win32"
      ? [{ name: "mpv", extensions: ["exe"] }]
      : [],
    properties: ["openFile" as const],
  };
  const result = mainWindow
    ? await dialog.showOpenDialog(mainWindow, dialogOptions)
    : await dialog.showOpenDialog(dialogOptions);

  if (result.canceled || !result.filePaths[0]) {
    return null;
  }

  const selected = result.filePaths[0];
  config.mpvPath = selected;
  saveConfig(config);
  return selected;
}

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

    mpvManager = new MpvManager(mpvPath);
    try {
      await mpvManager.start(options.streamUrl, {
        startTime: options.startTime,
      });
    } catch (err) {
      mpvManager = null;
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("socket") || msg.includes("timeout") || msg.includes("ENOENT")) {
        throw new Error("mpv failed to start. Make sure mpv is installed and on your PATH, or restart Shinobi to re-select the mpv location.");
      }
      throw err;
    }

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

app.whenReady().then(async () => {
  // Allow loading resources from the backend
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    callback({ requestHeaders: details.requestHeaders });
  });

  registerMpvIpc();
  createWindow();

  // Check mpv after window exists so dialogs have a parent
  const resolved = await resolveMpvPath();
  if (!resolved) {
    await dialog.showMessageBox(mainWindow!, {
      type: "error",
      title: "mpv required",
      message: "Shinobi requires mpv for video playback.",
      detail: "The app will now close. Install mpv and restart.",
    });
    app.quit();
    return;
  }
  mpvPath = resolved;

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
