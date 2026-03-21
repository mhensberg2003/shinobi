import { app, BrowserWindow, dialog, ipcMain, session } from "electron";
import { execFileSync, spawn } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const DEV_SERVER_URL = "http://localhost:3000";
const CONFIG_PATH = path.join(app.getPath("userData"), "shinobi-config.json");
let mainWindow: BrowserWindow | null = null;
let mpvPath = "mpv";
let mpvProcess: ReturnType<typeof spawn> | null = null;

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

function resolveMpvPathSync(): string | null {
  const config = loadConfig();

  if (config.mpvPath && existsSync(config.mpvPath)) {
    return config.mpvPath;
  }

  if (findMpvOnPath()) {
    return "mpv";
  }

  dialog.showMessageBoxSync({
    type: "warning",
    title: "mpv not found",
    message: "mpv is required for video playback.",
    detail: "mpv was not found on your PATH. Please select the location of mpv.exe in the next dialog.",
    buttons: ["Select mpv.exe", "Quit"],
    defaultId: 0,
    cancelId: 1,
  });

  const result = dialog.showOpenDialogSync({
    title: "Locate mpv.exe",
    filters: process.platform === "win32"
      ? [{ name: "mpv.exe", extensions: ["exe"] }]
      : [],
    properties: ["openFile"],
  });

  if (!result || !result[0]) {
    return null;
  }

  const selected = result[0];
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

function registerIpc() {
  ipcMain.handle("mpv:spawn", (_event, options: { streamUrl: string; startTime?: number }) => {
    // Kill existing mpv if running
    if (mpvProcess) {
      try { mpvProcess.kill(); } catch {}
      mpvProcess = null;
    }

    const args = [
      "--no-config",
      "--keep-open=yes",
      "--force-window=yes",
    ];

    if (options.startTime && options.startTime > 0) {
      args.push(`--start=${options.startTime}`);
    }

    args.push(options.streamUrl);

    mpvProcess = spawn(mpvPath, args, {
      stdio: "ignore",
      detached: false,
    });

    mpvProcess.on("exit", () => {
      mpvProcess = null;
      mainWindow?.webContents.send("mpv:ended");
    });

    mpvProcess.on("error", (err) => {
      console.error("[mpv] spawn error:", err.message);
      mpvProcess = null;
    });

    return { ok: true };
  });

  ipcMain.handle("mpv:quit", () => {
    if (mpvProcess) {
      try { mpvProcess.kill(); } catch {}
      mpvProcess = null;
    }
  });
}

app.whenReady().then(() => {
  const resolved = resolveMpvPathSync();
  if (!resolved) {
    app.quit();
    return;
  }
  mpvPath = resolved;

  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    callback({ requestHeaders: details.requestHeaders });
  });

  registerIpc();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (mpvProcess) {
    try { mpvProcess.kill(); } catch {}
    mpvProcess = null;
  }
  app.quit();
});
