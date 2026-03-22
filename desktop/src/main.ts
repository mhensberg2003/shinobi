import { app, BrowserWindow, dialog, ipcMain, session } from "electron";
import { execFileSync, spawn } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const DEV_SERVER_URL = "http://188.245.226.225:7823";
const CONFIG_PATH = path.join(app.getPath("userData"), "shinobi-config.json");
let mainWindow: BrowserWindow | null = null;
let mpvWindow: BrowserWindow | null = null;
let mpvPath = "mpv";
let mpvProcess: ReturnType<typeof spawn> | null = null;
let mpvIpc: MpvIpc | null = null;
let mpvProgressTimer: ReturnType<typeof setInterval> | null = null;
let spawnCounter = 0;

// ---------------------------------------------------------------------------
// Config persistence
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// mpv path resolution
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Native window handle helper
// ---------------------------------------------------------------------------

function readNativeHandle(win: BrowserWindow): string {
  const handle = win.getNativeWindowHandle();
  if (process.platform === "win32") {
    if (handle.length >= 8) {
      return handle.readBigUInt64LE(0).toString();
    }
    return handle.readUInt32LE(0).toString();
  }
  return handle.readUInt32LE(0).toString();
}

// ---------------------------------------------------------------------------
// Dedicated child window for mpv video output.
// A separate BrowserWindow with no web content so mpv's video surface
// isn't covered by Chromium's compositor.
// ---------------------------------------------------------------------------

function createMpvWindow(): BrowserWindow | null {
  if (!mainWindow) return null;

  const bounds = mainWindow.getContentBounds();

  const win = new BrowserWindow({
    parent: mainWindow,
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    frame: false,
    hasShadow: false,
    resizable: false,
    movable: false,
    focusable: true,
    skipTaskbar: true,
    backgroundColor: "#000000",
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load blank page — no Chromium content to cover mpv
  win.loadURL("about:blank");
  win.show();

  // Keep mpv window in sync when main window moves/resizes
  const syncBounds = () => {
    if (win.isDestroyed() || !mainWindow) return;
    const b = mainWindow.getContentBounds();
    win.setBounds({ x: b.x, y: b.y, width: b.width, height: b.height });
  };
  mainWindow.on("resize", syncBounds);
  mainWindow.on("move", syncBounds);
  mainWindow.on("maximize", syncBounds);
  mainWindow.on("unmaximize", syncBounds);
  mainWindow.on("restore", syncBounds);

  win.on("closed", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.removeListener("resize", syncBounds);
      mainWindow.removeListener("move", syncBounds);
      mainWindow.removeListener("maximize", syncBounds);
      mainWindow.removeListener("unmaximize", syncBounds);
      mainWindow.removeListener("restore", syncBounds);
    }
  });

  return win;
}

function destroyMpvWindow() {
  if (mpvWindow && !mpvWindow.isDestroyed()) {
    mpvWindow.close();
  }
  mpvWindow = null;
}

// ---------------------------------------------------------------------------
// Persistent mpv JSON IPC connection
// ---------------------------------------------------------------------------

type MpvResponse = {
  data?: unknown;
  error?: string;
  request_id?: number;
  event?: string;
};

class MpvIpc {
  private socket: net.Socket | null = null;
  private pipeName: string;
  private nextId = 0;
  private pending = new Map<number, {
    resolve: (v: MpvResponse) => void;
    timer: ReturnType<typeof setTimeout>;
  }>();
  private buffer = "";
  private connected = false;

  constructor(pipeName: string) {
    this.pipeName = pipeName;
  }

  connect(retries = 10, delayMs = 300): Promise<void> {
    return new Promise((resolve, reject) => {
      const attempt = (remaining: number) => {
        const sock = net.createConnection(this.pipeName);

        sock.on("connect", () => {
          this.socket = sock;
          this.connected = true;
          sock.on("data", (chunk) => this.onData(chunk));
          sock.on("close", () => {
            this.connected = false;
            this.socket = null;
          });
          resolve();
        });

        sock.on("error", () => {
          sock.destroy();
          if (remaining > 0) {
            setTimeout(() => attempt(remaining - 1), delayMs);
          } else {
            reject(new Error("Failed to connect to mpv IPC"));
          }
        });
      };
      attempt(retries);
    });
  }

  private onData(chunk: Buffer) {
    this.buffer += chunk.toString();
    const lines = this.buffer.split("\n");
    this.buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg: MpvResponse = JSON.parse(line);
        if (msg.request_id != null && this.pending.has(msg.request_id)) {
          const entry = this.pending.get(msg.request_id)!;
          clearTimeout(entry.timer);
          this.pending.delete(msg.request_id);
          entry.resolve(msg);
        }
      } catch {}
    }
  }

  command(args: unknown[]): Promise<MpvResponse> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.connected) {
        return reject(new Error("not connected"));
      }
      const id = ++this.nextId;
      const timer = setTimeout(() => {
        this.pending.delete(id);
        resolve({ error: "timeout" });
      }, 3000);
      this.pending.set(id, { resolve, timer });
      this.socket.write(JSON.stringify({ command: args, request_id: id }) + "\n");
    });
  }

  async getProperty(name: string): Promise<unknown> {
    const res = await this.command(["get_property", name]);
    if (res.error && res.error !== "success") return null;
    return res.data;
  }

  async setProperty(name: string, value: unknown): Promise<void> {
    await this.command(["set_property", name, value]);
  }

  destroy() {
    for (const [, { timer }] of this.pending) clearTimeout(timer);
    this.pending.clear();
    this.socket?.destroy();
    this.socket = null;
    this.connected = false;
  }
}

// ---------------------------------------------------------------------------
// mpv IPC pipe naming
// ---------------------------------------------------------------------------

function getMpvPipeName(id: number): string {
  if (process.platform === "win32") {
    return `\\\\.\\pipe\\shinobi-mpv-${process.pid}-${id}`;
  }
  return `/tmp/shinobi-mpv-${process.pid}-${id}.sock`;
}

// ---------------------------------------------------------------------------
// Progress polling
// ---------------------------------------------------------------------------

function stopProgressPolling() {
  if (mpvProgressTimer) {
    clearInterval(mpvProgressTimer);
    mpvProgressTimer = null;
  }
}

function startProgressPolling() {
  stopProgressPolling();
  mpvProgressTimer = setInterval(async () => {
    if (!mpvIpc || !mpvProcess) {
      stopProgressPolling();
      return;
    }
    try {
      const [timePos, duration, pause] = await Promise.all([
        mpvIpc.getProperty("time-pos"),
        mpvIpc.getProperty("duration"),
        mpvIpc.getProperty("pause"),
      ]);
      if (timePos != null && mainWindow) {
        mainWindow.webContents.send("mpv:progress", {
          currentTime: timePos as number,
          duration: (duration as number) ?? 0,
          paused: pause as boolean,
        });
      }
    } catch {}
  }, 1000);
}

// ---------------------------------------------------------------------------
// Electron window
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Cleanup helper
// ---------------------------------------------------------------------------

function killMpv(notify = true) {
  stopProgressPolling();
  mpvIpc?.destroy();
  mpvIpc = null;
  if (mpvProcess) {
    const proc = mpvProcess;
    mpvProcess = null;
    proc.removeAllListeners("exit");
    try { proc.kill(); } catch {}
  }
  destroyMpvWindow();
  if (notify && mainWindow) {
    mainWindow.webContents.send("mpv:ended");
  }
}

// ---------------------------------------------------------------------------
// IPC handlers
// ---------------------------------------------------------------------------

function registerIpc() {
  // ---- mpv spawn (embedded via --wid in a dedicated child window) ----
  ipcMain.handle("mpv:spawn", async (_event, options: { streamUrl: string; startTime?: number }) => {
    // Kill any existing mpv without notifying renderer
    killMpv(false);

    // Create a dedicated child window for mpv to render into.
    // This avoids Chromium's compositor covering the video.
    mpvWindow = createMpvWindow();
    const wid = mpvWindow ? readNativeHandle(mpvWindow) : null;

    spawnCounter++;
    const pipeName = getMpvPipeName(spawnCounter);

    const args = [
      "--no-config",
      "--keep-open=yes",
      `--input-ipc-server=${pipeName}`,
      "--osc=yes",
      "--cursor-autohide=1000",
      "--title=Shinobi",
    ];

    if (wid) {
      args.push(`--wid=${wid}`);
    } else {
      // Fallback: separate window
      args.push("--force-window=yes");
    }

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
      mpvIpc?.destroy();
      mpvIpc = null;
      destroyMpvWindow();
      mainWindow?.webContents.send("mpv:ended");
    });

    mpvProcess.on("error", () => {
      mpvProcess = null;
      stopProgressPolling();
      mpvIpc?.destroy();
      mpvIpc = null;
      destroyMpvWindow();
    });

    // Connect to mpv's JSON IPC (retries while mpv starts up)
    try {
      const ipc = new MpvIpc(pipeName);
      await ipc.connect();
      mpvIpc = ipc;
      startProgressPolling();
    } catch {
      // IPC failed but mpv might still be running in fallback mode
    }

    return { ok: true, embedded: !!wid };
  });

  // ---- mpv quit ----
  ipcMain.handle("mpv:quit", () => {
    killMpv(false);
  });

  // ---- Send arbitrary command to mpv ----
  ipcMain.handle("mpv:command", async (_event, args: unknown[]) => {
    if (!mpvIpc) return { error: "not connected" };
    try {
      const res = await mpvIpc.command(args);
      return { ok: true, data: res.data, error: res.error };
    } catch (err) {
      return { error: String(err) };
    }
  });

  // ---- Get mpv property ----
  ipcMain.handle("mpv:get-property", async (_event, name: string) => {
    if (!mpvIpc) return null;
    try {
      return await mpvIpc.getProperty(name);
    } catch {
      return null;
    }
  });

  // ---- Set mpv property ----
  ipcMain.handle("mpv:set-property", async (_event, name: string, value: unknown) => {
    if (!mpvIpc) return { error: "not connected" };
    try {
      await mpvIpc.setProperty(name, value);
      return { ok: true };
    } catch (err) {
      return { error: String(err) };
    }
  });

  // ---- Get track list (audio, subtitle, video) ----
  ipcMain.handle("mpv:get-tracks", async () => {
    if (!mpvIpc) return [];
    try {
      const trackList = await mpvIpc.getProperty("track-list");
      return trackList ?? [];
    } catch {
      return [];
    }
  });

  // ---- Window controls ----
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
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

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
  killMpv(false);
  app.quit();
});
