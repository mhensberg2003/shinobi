import { app, BrowserWindow, dialog, ipcMain, session } from "electron";
import { execFileSync, spawn } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const DEV_SERVER_URL = "http://188.245.226.225:7823";
const CONFIG_PATH = path.join(app.getPath("userData"), "shinobi-config.json");
let mainWindow: BrowserWindow | null = null;
let mpvPath = "mpv";
let mpvProcess: ReturnType<typeof spawn> | null = null;
let mpvIpcTimer: ReturnType<typeof setInterval> | null = null;
let spawnCounter = 0;

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
    icon: path.join(__dirname, "../assets/icon.png"),
    frame: false,
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

function getMpvPipeName(id: number): string {
  if (process.platform === "win32") {
    return `\\\\.\\pipe\\shinobi-mpv-${process.pid}-${id}`;
  }
  return `/tmp/shinobi-mpv-${process.pid}-${id}.sock`;
}

function queryMpvProperty(pipeName: string, property: string): Promise<number | null> {
  return new Promise((resolve) => {
    const client = net.createConnection(pipeName);
    let data = "";
    const timeout = setTimeout(() => {
      client.destroy();
      resolve(null);
    }, 2000);

    client.on("connect", () => {
      client.write(JSON.stringify({ command: ["get_property", property] }) + "\n");
    });

    client.on("data", (chunk) => {
      data += chunk.toString();
      const lines = data.split("\n");
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line) as { data?: number; error?: string };
          if (parsed.error === "success" && typeof parsed.data === "number") {
            clearTimeout(timeout);
            client.destroy();
            resolve(parsed.data);
            return;
          }
        } catch {}
      }
    });

    client.on("error", () => {
      clearTimeout(timeout);
      resolve(null);
    });
  });
}

function stopProgressPolling() {
  if (mpvIpcTimer) {
    clearInterval(mpvIpcTimer);
    mpvIpcTimer = null;
  }
}

function startProgressPolling(pipeName: string) {
  stopProgressPolling();

  // Wait a moment for mpv to set up the IPC server
  setTimeout(() => {
    mpvIpcTimer = setInterval(async () => {
      if (!mpvProcess) {
        stopProgressPolling();
        return;
      }

      try {
        const [currentTime, duration] = await Promise.all([
          queryMpvProperty(pipeName, "time-pos"),
          queryMpvProperty(pipeName, "duration"),
        ]);

        if (currentTime != null && mainWindow) {
          mainWindow.webContents.send("mpv:progress", {
            currentTime,
            duration: duration ?? 0,
          });
        }
      } catch {}
    }, 5000);
  }, 2000);
}

function registerIpc() {
  ipcMain.handle("mpv:spawn", (_event, options: { streamUrl: string; startTime?: number }) => {
    // Kill existing mpv if running — don't notify renderer
    if (mpvProcess) {
      const old = mpvProcess;
      mpvProcess = null;
      old.removeAllListeners("exit");
      try { old.kill(); } catch {}
    }
    stopProgressPolling();

    spawnCounter++;
    const pipeName = getMpvPipeName(spawnCounter);

    const args = [
      "--no-config",
      "--keep-open=yes",
      "--force-window=yes",
      `--input-ipc-server=${pipeName}`,
    ];

    if (options.startTime && options.startTime > 0) {
      args.push(`--start=${options.startTime}`);
    }

    args.push(options.streamUrl);

    mpvProcess = spawn(mpvPath, args, {
      stdio: ["ignore", "pipe", "pipe"],
      detached: false,
    });

    mpvProcess.stdout?.on("data", () => {});
    mpvProcess.stderr?.on("data", () => {});

    mpvProcess.on("exit", () => {
      mpvProcess = null;
      stopProgressPolling();
      mainWindow?.webContents.send("mpv:ended");
    });

    mpvProcess.on("error", () => {
      mpvProcess = null;
      stopProgressPolling();
    });

    startProgressPolling(pipeName);

    return { ok: true };
  });

  ipcMain.handle("window:minimize", () => mainWindow?.minimize());
  ipcMain.handle("window:maximize", () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.handle("window:close", () => mainWindow?.close());
  ipcMain.handle("window:isMaximized", () => mainWindow?.isMaximized() ?? false);

  ipcMain.handle("mpv:quit", () => {
    stopProgressPolling();
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
