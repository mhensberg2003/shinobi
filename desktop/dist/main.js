"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electron_updater_1 = require("electron-updater");
const node_child_process_1 = require("node:child_process");
const node_fs_1 = require("node:fs");
const node_net_1 = __importDefault(require("node:net"));
const node_path_1 = __importDefault(require("node:path"));
const DEV_SERVER_URL = "http://188.245.226.225:7823";
const CONFIG_PATH = node_path_1.default.join(electron_1.app.getPath("userData"), "shinobi-config.json");
let mainWindow = null;
let mpvWindow = null;
let mpvPath = "mpv";
let mpvProcess = null;
let mpvIpc = null;
let mpvProgressTimer = null;
let spawnCounter = 0;
// ---------------------------------------------------------------------------
// Config persistence
// ---------------------------------------------------------------------------
function loadConfig() {
    try {
        if ((0, node_fs_1.existsSync)(CONFIG_PATH)) {
            return JSON.parse((0, node_fs_1.readFileSync)(CONFIG_PATH, "utf-8"));
        }
    }
    catch { }
    return {};
}
function saveConfig(config) {
    try {
        (0, node_fs_1.writeFileSync)(CONFIG_PATH, JSON.stringify(config, null, 2));
    }
    catch { }
}
// ---------------------------------------------------------------------------
// mpv path resolution
// ---------------------------------------------------------------------------
function findMpvOnPath() {
    try {
        const cmd = process.platform === "win32" ? "where" : "which";
        (0, node_child_process_1.execFileSync)(cmd, ["mpv"], { stdio: "ignore" });
        return true;
    }
    catch {
        return false;
    }
}
function resolveMpvPathSync() {
    const config = loadConfig();
    if (config.mpvPath && (0, node_fs_1.existsSync)(config.mpvPath)) {
        return config.mpvPath;
    }
    if (findMpvOnPath()) {
        return "mpv";
    }
    electron_1.dialog.showMessageBoxSync({
        type: "warning",
        title: "mpv not found",
        message: "mpv is required for video playback.",
        detail: "mpv was not found on your PATH. Please select the location of mpv.exe in the next dialog.",
        buttons: ["Select mpv.exe", "Quit"],
        defaultId: 0,
        cancelId: 1,
    });
    const result = electron_1.dialog.showOpenDialogSync({
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
function readNativeHandle(win) {
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
// Transparent BrowserWindow — mpv renders via --wid underneath the
// Chromium layer. The overlay page provides custom player controls and
// forwards all input to mpv via JSON IPC (mpv's own OSC is disabled).
// ---------------------------------------------------------------------------
function createMpvWindow() {
    if (!mainWindow)
        return null;
    const bounds = mainWindow.getContentBounds();
    const win = new electron_1.BrowserWindow({
        parent: mainWindow,
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        frame: false,
        transparent: true,
        hasShadow: false,
        resizable: false,
        movable: false,
        focusable: true,
        skipTaskbar: true,
        show: false,
        webPreferences: {
            preload: node_path_1.default.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    // Load transparent overlay with player controls
    win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(PLAYER_OVERLAY_HTML)}`);
    win.show();
    win.focus();
    console.log("[mpv-window] created | bounds:", bounds, "| handle:", readNativeHandle(win));
    // Keep mpv window in sync when main window moves/resizes
    const syncBounds = () => {
        if (win.isDestroyed() || !mainWindow)
            return;
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
// Inline HTML for the transparent player overlay.
// Controls mpv entirely via preload IPC — no direct input to mpv needed.
// ---------------------------------------------------------------------------
const PLAYER_OVERLAY_HTML = `<!DOCTYPE html>
<html style="background:transparent;margin:0;padding:0;overflow:hidden;user-select:none">
<head><style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:transparent; width:100vw; height:100vh; font-family:system-ui,-apple-system,sans-serif; color:#fff; cursor:none; }
  body.show-cursor { cursor:default; }
  body.show-cursor .controls { opacity:1; }

  .controls {
    position:fixed; bottom:0; left:0; right:0;
    background:linear-gradient(transparent, rgba(0,0,0,0.85));
    padding:16px 20px 14px; opacity:0; transition:opacity 0.25s;
    display:flex; flex-direction:column; gap:8px;
  }

  .seek-row { display:flex; align-items:center; gap:10px; font-size:12px; color:rgba(255,255,255,0.6); }
  .seek-bar-wrap { flex:1; height:4px; background:rgba(255,255,255,0.15); border-radius:2px; cursor:pointer; position:relative; }
  .seek-bar-wrap:hover { height:6px; }
  .seek-fill { height:100%; background:#e50914; border-radius:2px; pointer-events:none; }

  .btn-row { display:flex; align-items:center; gap:14px; }
  .btn { background:none; border:none; color:#fff; cursor:pointer; padding:4px; opacity:0.85; display:flex; align-items:center; }
  .btn:hover { opacity:1; }
  .btn svg { width:22px; height:22px; }
  .spacer { flex:1; }

  .vol-wrap { display:flex; align-items:center; gap:6px; }
  .vol-bar { width:70px; height:3px; background:rgba(255,255,255,0.2); border-radius:2px; cursor:pointer; position:relative; }
  .vol-fill { height:100%; background:#fff; border-radius:2px; pointer-events:none; }

  .track-menu {
    position:fixed; bottom:70px; right:20px; background:rgba(20,20,20,0.95);
    border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:6px 0;
    min-width:200px; display:none; font-size:13px; max-height:60vh; overflow-y:auto;
  }
  .track-menu.open { display:block; }
  .track-menu-title { padding:6px 14px; font-size:11px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.5px; }
  .track-item { padding:7px 14px; cursor:pointer; display:flex; align-items:center; gap:8px; }
  .track-item:hover { background:rgba(255,255,255,0.08); }
  .track-item.active { color:#e50914; }
  .track-dot { width:6px; height:6px; border-radius:50%; background:transparent; flex-shrink:0; }
  .track-item.active .track-dot { background:#e50914; }

  @keyframes spin { to { transform:rotate(360deg); } }
  .loader {
    position:fixed; inset:0; display:flex; align-items:center; justify-content:center;
    transition:opacity 0.3s; pointer-events:none;
  }
  .loader.hidden { opacity:0; }
  .loader-ring {
    width:36px; height:36px; border-radius:50%;
    border:2.5px solid rgba(255,255,255,0.1); border-top-color:rgba(255,255,255,0.7);
    animation:spin 0.8s linear infinite;
  }

  .title-bar {
    position:fixed; top:0; left:0; right:0; padding:14px 18px;
    background:linear-gradient(rgba(0,0,0,0.7), transparent);
    opacity:0; transition:opacity 0.25s; display:flex; align-items:center; gap:12px;
  }
  body.show-cursor .title-bar { opacity:1; }
  .back-btn {
    background:none; border:none; color:#fff; cursor:pointer; padding:6px;
    border-radius:50%; display:flex; align-items:center; opacity:0.85; transition:background 0.15s;
  }
  .back-btn:hover { opacity:1; background:rgba(255,255,255,0.1); }
  .back-btn svg { width:22px; height:22px; }
</style></head>
<body>
  <div class="loader" id="loader"><div class="loader-ring"></div></div>
  <div class="title-bar" id="titleBar">
    <button class="back-btn" id="backBtn" title="Back">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
    </button>
  </div>

  <div class="controls">
    <div class="seek-row">
      <span id="timePos">0:00</span>
      <div class="seek-bar-wrap" id="seekBar"><div class="seek-fill" id="seekFill" style="width:0%"></div></div>
      <span id="duration">0:00</span>
    </div>
    <div class="btn-row">
      <button class="btn" id="playBtn" title="Play/Pause">
        <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20"/></svg>
      </button>
      <div class="vol-wrap">
        <button class="btn" id="muteBtn" title="Mute">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="currentColor"/><path d="M15.54 8.46a5 5 0 010 7.07"/><path d="M19.07 4.93a10 10 0 010 14.14"/></svg>
        </button>
        <div class="vol-bar" id="volBar"><div class="vol-fill" id="volFill" style="width:100%"></div></div>
      </div>
      <span class="spacer"></span>
      <button class="btn" id="subBtn" title="Subtitles">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="6" y1="14" x2="14" y2="14"/><line x1="6" y1="18" x2="18" y2="18"/></svg>
      </button>
      <button class="btn" id="audioBtn" title="Audio">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3" fill="currentColor"/><circle cx="18" cy="16" r="3" fill="currentColor"/></svg>
      </button>
      <button class="btn" id="fsBtn" title="Fullscreen">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15,3 21,3 21,9"/><polyline points="9,21 3,21 3,15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
      </button>
    </div>
  </div>
  <div class="track-menu" id="trackMenu"></div>

<script>
const api = window.electronAPI?.mpv;
if (!api) console.error("electronAPI.mpv not available");

let paused = false, currentTime = 0, dur = 0, volume = 100, muted = false;
let tracks = [], hideTimer = null, menuOpen = null;

// --- Formatting ---
function fmt(s) {
  if (!isFinite(s) || s < 0) return "0:00";
  const t = Math.floor(s), h = Math.floor(t/3600), m = Math.floor((t%3600)/60), sec = t%60;
  return h > 0 ? h+":"+String(m).padStart(2,"0")+":"+String(sec).padStart(2,"0") : m+":"+String(sec).padStart(2,"0");
}

// --- Progress from main process ---
api.onProgress((d) => {
  currentTime = d.currentTime; dur = d.duration; paused = d.paused;
  const loader = document.getElementById("loader");
  if (loader && !loader.classList.contains("hidden")) loader.classList.add("hidden");
  document.getElementById("timePos").textContent = fmt(currentTime);
  document.getElementById("duration").textContent = fmt(dur);
  document.getElementById("seekFill").style.width = dur > 0 ? (currentTime/dur*100)+"%" : "0%";
  updatePlayIcon();
});

function updatePlayIcon() {
  document.getElementById("playBtn").innerHTML = paused
    ? '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="4" height="16"/><rect x="15" y="4" width="4" height="16"/></svg>';
}

// --- Play/Pause ---
document.getElementById("playBtn").onclick = () => {
  api.command(["cycle", "pause"]);
  paused = !paused; updatePlayIcon();
};

// --- Seek bar ---
document.getElementById("seekBar").onclick = (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  if (dur > 0) api.command(["seek", pct * dur, "absolute"]);
};

// --- Volume ---
document.getElementById("volBar").onclick = (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  volume = Math.round(pct * 100);
  api.setProperty("volume", volume);
  document.getElementById("volFill").style.width = volume + "%";
};
document.getElementById("muteBtn").onclick = () => {
  muted = !muted;
  api.setProperty("mute", muted ? "yes" : "no");
};

// --- Fullscreen ---
document.getElementById("fsBtn").onclick = () => {
  api.toggleFullscreen();
};

// --- Back ---
document.getElementById("backBtn").onclick = () => {
  api.back();
};

// --- Track menus ---
async function loadTracks() {
  tracks = await api.getTracks() || [];
}

function showTrackMenu(kind) {
  if (menuOpen === kind) { closeMenu(); return; }
  menuOpen = kind;
  const menu = document.getElementById("trackMenu");
  const filtered = tracks.filter(t => t.type === kind);
  const title = kind === "sub" ? "Subtitles" : "Audio";
  let html = '<div class="track-menu-title">' + title + '</div>';
  if (kind === "sub") {
    html += '<div class="track-item' + (filtered.every(t => !t.selected) ? ' active' : '') + '" data-id="0"><span class="track-dot"></span>Off</div>';
  }
  for (const t of filtered) {
    const label = (t.title || "") + (t.lang ? " [" + t.lang + "]" : "") || "Track " + t.id;
    html += '<div class="track-item' + (t.selected ? ' active' : '') + '" data-id="' + t.id + '"><span class="track-dot"></span>' + label + '</div>';
  }
  menu.innerHTML = html;
  menu.classList.add("open");
  menu.querySelectorAll(".track-item").forEach(el => {
    el.onclick = () => {
      const id = parseInt(el.dataset.id);
      if (kind === "sub") api.setProperty("sid", id === 0 ? "no" : id);
      else api.setProperty("aid", id);
      closeMenu(); loadTracks();
    };
  });
}
function closeMenu() { menuOpen = null; document.getElementById("trackMenu").classList.remove("open"); }

document.getElementById("subBtn").onclick = () => { loadTracks().then(() => showTrackMenu("sub")); };
document.getElementById("audioBtn").onclick = () => { loadTracks().then(() => showTrackMenu("audio")); };

// --- Cursor auto-hide ---
function showCursor() {
  document.body.classList.add("show-cursor");
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => { if (!menuOpen) document.body.classList.remove("show-cursor"); }, 2500);
}
document.addEventListener("mousemove", showCursor);
document.addEventListener("click", (e) => {
  // Click on empty area (not controls) = toggle pause
  if (e.target === document.body) {
    api.command(["cycle", "pause"]);
    paused = !paused; updatePlayIcon();
  }
});
showCursor();

// --- Keyboard shortcuts ---
document.addEventListener("keydown", (e) => {
  showCursor();
  closeMenu();
  switch(e.key) {
    case " ": e.preventDefault(); api.command(["cycle", "pause"]); paused = !paused; updatePlayIcon(); break;
    case "ArrowLeft": api.command(["seek", -10]); break;
    case "ArrowRight": api.command(["seek", 10]); break;
    case "ArrowUp": volume = Math.min(100, volume + 5); api.setProperty("volume", volume); document.getElementById("volFill").style.width = volume+"%"; break;
    case "ArrowDown": volume = Math.max(0, volume - 5); api.setProperty("volume", volume); document.getElementById("volFill").style.width = volume+"%"; break;
    case "m": api.command(["cycle", "mute"]); muted = !muted; break;
    case "f": api.toggleFullscreen(); break;
    case "Escape": api.back(); break;
    case "j": api.command(["cycle", "sub"]); loadTracks(); break;
    case "J": api.command(["cycle", "sub", "down"]); loadTracks(); break;
    case "#": api.command(["cycle", "audio"]); loadTracks(); break;
  }
});

// Initial track load
setTimeout(loadTracks, 2000);
</script>
</body></html>`;
class MpvIpc {
    socket = null;
    pipeName;
    nextId = 0;
    pending = new Map();
    buffer = "";
    connected = false;
    constructor(pipeName) {
        this.pipeName = pipeName;
    }
    connect(retries = 10, delayMs = 300) {
        return new Promise((resolve, reject) => {
            const attempt = (remaining) => {
                const sock = node_net_1.default.createConnection(this.pipeName);
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
                    }
                    else {
                        reject(new Error("Failed to connect to mpv IPC"));
                    }
                });
            };
            attempt(retries);
        });
    }
    onData(chunk) {
        this.buffer += chunk.toString();
        const lines = this.buffer.split("\n");
        this.buffer = lines.pop() ?? "";
        for (const line of lines) {
            if (!line.trim())
                continue;
            try {
                const msg = JSON.parse(line);
                if (msg.request_id != null && this.pending.has(msg.request_id)) {
                    const entry = this.pending.get(msg.request_id);
                    clearTimeout(entry.timer);
                    this.pending.delete(msg.request_id);
                    entry.resolve(msg);
                }
            }
            catch { }
        }
    }
    command(args) {
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
    async getProperty(name) {
        const res = await this.command(["get_property", name]);
        if (res.error && res.error !== "success")
            return null;
        return res.data;
    }
    async setProperty(name, value) {
        await this.command(["set_property", name, value]);
    }
    destroy() {
        for (const [, { timer }] of this.pending)
            clearTimeout(timer);
        this.pending.clear();
        this.socket?.destroy();
        this.socket = null;
        this.connected = false;
    }
}
// ---------------------------------------------------------------------------
// mpv IPC pipe naming
// ---------------------------------------------------------------------------
function getMpvPipeName(id) {
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
            if (timePos != null) {
                const progress = {
                    currentTime: timePos,
                    duration: duration ?? 0,
                    paused: pause,
                };
                // Send to BOTH main window (for heartbeat) and overlay (for controls)
                mainWindow?.webContents.send("mpv:progress", progress);
                if (mpvWindow && !mpvWindow.isDestroyed()) {
                    mpvWindow.webContents.send("mpv:progress", progress);
                }
            }
        }
        catch { }
    }, 500);
}
// ---------------------------------------------------------------------------
// Electron window
// ---------------------------------------------------------------------------
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 500,
        backgroundColor: "#141414",
        title: "Shinobi",
        icon: node_path_1.default.join(__dirname, "../assets/icon.png"),
        frame: false,
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
        try {
            proc.kill();
        }
        catch { }
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
    // ---- mpv spawn (embedded via --wid in a transparent overlay window) ----
    electron_1.ipcMain.handle("mpv:spawn", async (_event, options) => {
        killMpv(false);
        // Create transparent overlay window — mpv renders behind it via --wid,
        // visible through the transparent Chromium layer. Controls are in the overlay.
        mpvWindow = createMpvWindow();
        const wid = mpvWindow ? readNativeHandle(mpvWindow) : null;
        spawnCounter++;
        const pipeName = getMpvPipeName(spawnCounter);
        const args = [
            "--no-config",
            "--keep-open=yes",
            `--input-ipc-server=${pipeName}`,
            "--no-osc",
            "--no-osd-bar",
            "--no-input-default-bindings",
            "--cursor-autohide=no",
            "--title=Shinobi",
        ];
        if (wid) {
            args.push(`--wid=${wid}`);
        }
        else {
            args.push("--force-window=yes");
        }
        if (options.startTime && options.startTime > 0) {
            args.push(`--start=${options.startTime}`);
        }
        args.push(options.streamUrl);
        console.log("[mpv] spawning with args:", args);
        console.log("[mpv] wid:", wid, "| mpvWindow bounds:", mpvWindow?.getBounds());
        mpvProcess = (0, node_child_process_1.spawn)(mpvPath, args, {
            stdio: ["ignore", "pipe", "pipe"],
            detached: false,
        });
        mpvProcess.stdout?.on("data", (chunk) => {
            console.log("[mpv:stdout]", chunk.toString().trim());
        });
        mpvProcess.stderr?.on("data", (chunk) => {
            console.log("[mpv:stderr]", chunk.toString().trim());
        });
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
        // Connect to mpv's JSON IPC
        try {
            const ipc = new MpvIpc(pipeName);
            await ipc.connect();
            mpvIpc = ipc;
            console.log("[mpv] IPC connected to", pipeName);
            const vo = await ipc.getProperty("current-vo");
            const videoParams = await ipc.getProperty("video-params");
            console.log("[mpv] vo:", vo, "| video-params:", JSON.stringify(videoParams));
            startProgressPolling();
        }
        catch (err) {
            console.error("[mpv] IPC connection failed:", err);
        }
        return { ok: true, embedded: !!wid };
    });
    // ---- mpv quit ----
    electron_1.ipcMain.handle("mpv:quit", () => {
        killMpv(false);
        mainWindow?.webContents.send("mpv:ended");
    });
    // ---- Send arbitrary command to mpv ----
    electron_1.ipcMain.handle("mpv:command", async (_event, args) => {
        if (!mpvIpc)
            return { error: "not connected" };
        try {
            const res = await mpvIpc.command(args);
            return { ok: true, data: res.data, error: res.error };
        }
        catch (err) {
            return { error: String(err) };
        }
    });
    // ---- Get mpv property ----
    electron_1.ipcMain.handle("mpv:get-property", async (_event, name) => {
        if (!mpvIpc)
            return null;
        try {
            return await mpvIpc.getProperty(name);
        }
        catch {
            return null;
        }
    });
    // ---- Set mpv property ----
    electron_1.ipcMain.handle("mpv:set-property", async (_event, name, value) => {
        if (!mpvIpc)
            return { error: "not connected" };
        try {
            await mpvIpc.setProperty(name, value);
            return { ok: true };
        }
        catch (err) {
            return { error: String(err) };
        }
    });
    // ---- Get track list ----
    electron_1.ipcMain.handle("mpv:get-tracks", async () => {
        if (!mpvIpc)
            return [];
        try {
            const trackList = await mpvIpc.getProperty("track-list");
            return trackList ?? [];
        }
        catch {
            return [];
        }
    });
    // ---- Window controls ----
    // ---- Exit player and navigate back in the main window ----
    electron_1.ipcMain.handle("mpv:back", () => {
        if (mainWindow?.isFullScreen()) {
            mainWindow.setFullScreen(false);
        }
        killMpv(false);
        mainWindow?.webContents.send("mpv:back");
    });
    // ---- Toggle fullscreen (controls both main + mpv overlay windows) ----
    electron_1.ipcMain.handle("mpv:toggle-fullscreen", () => {
        if (!mainWindow)
            return false;
        const isFs = mainWindow.isFullScreen();
        mainWindow.setFullScreen(!isFs);
        // mpvWindow syncs via the resize listener
        return !isFs;
    });
    electron_1.ipcMain.handle("mpv:is-fullscreen", () => {
        return mainWindow?.isFullScreen() ?? false;
    });
    // ---- Window controls ----
    electron_1.ipcMain.handle("window:minimize", () => mainWindow?.minimize());
    electron_1.ipcMain.handle("window:maximize", () => {
        if (mainWindow?.isMaximized()) {
            mainWindow.unmaximize();
        }
        else {
            mainWindow?.maximize();
        }
    });
    electron_1.ipcMain.handle("window:close", () => mainWindow?.close());
    electron_1.ipcMain.handle("window:isMaximized", () => mainWindow?.isMaximized() ?? false);
}
// ---------------------------------------------------------------------------
// Auto-updater (checks GitHub Releases for new versions)
// ---------------------------------------------------------------------------
function setupAutoUpdater() {
    electron_updater_1.autoUpdater.autoDownload = false;
    electron_updater_1.autoUpdater.autoInstallOnAppQuit = false;
    // Private repo — read-only token to access releases API
    electron_updater_1.autoUpdater.setFeedURL({
        provider: "github",
        owner: "mhensberg2003",
        repo: "shinobi",
        private: true,
        token: "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",
    });
    electron_updater_1.autoUpdater.on("update-available", (info) => {
        console.log("[updater] Update available:", info.version);
        mainWindow?.webContents.send("update:available", {
            version: info.version,
            currentVersion: electron_1.app.getVersion(),
        });
    });
    electron_updater_1.autoUpdater.on("update-not-available", () => {
        console.log("[updater] App is up to date");
    });
    electron_updater_1.autoUpdater.on("download-progress", (progress) => {
        mainWindow?.webContents.send("update:download-progress", {
            percent: Math.round(progress.percent),
        });
    });
    electron_updater_1.autoUpdater.on("update-downloaded", () => {
        console.log("[updater] Update downloaded, ready to install");
        mainWindow?.webContents.send("update:downloaded");
    });
    electron_updater_1.autoUpdater.on("error", (err) => {
        console.error("[updater] Error:", err);
        mainWindow?.webContents.send("update:error", { message: String(err) });
    });
    // IPC: renderer requests download
    electron_1.ipcMain.handle("update:download", () => {
        electron_updater_1.autoUpdater.downloadUpdate();
    });
    // IPC: renderer requests install (quit and install)
    electron_1.ipcMain.handle("update:install", () => {
        electron_updater_1.autoUpdater.quitAndInstall(false, true);
    });
    // Check now, then every 30 minutes
    electron_updater_1.autoUpdater.checkForUpdates().catch((err) => {
        console.error("[updater] Initial check failed:", err);
    });
    setInterval(() => {
        electron_updater_1.autoUpdater.checkForUpdates().catch(() => { });
    }, 30 * 60 * 1000);
}
// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------
electron_1.app.whenReady().then(() => {
    const resolved = resolveMpvPathSync();
    if (!resolved) {
        electron_1.app.quit();
        return;
    }
    mpvPath = resolved;
    electron_1.session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        callback({ requestHeaders: details.requestHeaders });
    });
    registerIpc();
    createWindow();
    setupAutoUpdater();
    electron_1.app.on("activate", () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on("window-all-closed", () => {
    killMpv(false);
    electron_1.app.quit();
});
//# sourceMappingURL=main.js.map