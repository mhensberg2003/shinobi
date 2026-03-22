"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MpvManager = void 0;
const node_child_process_1 = require("node:child_process");
const node_net_1 = require("node:net");
const node_events_1 = require("node:events");
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const node_os_1 = __importDefault(require("node:os"));
let spawnCounter = 0;
function getSocketPaths() {
    const id = `shinobi-mpv-${process.pid}-${++spawnCounter}`;
    const socketPath = process.platform === "win32"
        ? `\\\\.\\pipe\\${id}`
        : node_path_1.default.join(node_os_1.default.tmpdir(), `${id}.sock`);
    // mpv on Windows auto-adds \\.\pipe\ prefix
    const mpvIpcArg = process.platform === "win32" ? id : socketPath;
    return { socketPath, mpvIpcArg };
}
const OBSERVED_PROPERTIES = ["time-pos", "duration", "pause", "volume", "mute", "track-list", "eof-reached"];
const MPV_CONNECT_TIMEOUT_MS = 10000;
const MPV_CONNECT_RETRY_MS = 200;
class MpvManager extends node_events_1.EventEmitter {
    process = null;
    socket = null;
    socketPath = "";
    requestId = 0;
    pendingRequests = new Map();
    buffer = "";
    mpvBinary;
    destroyed = false;
    constructor(mpvBinary = "mpv") {
        super();
        this.mpvBinary = mpvBinary;
    }
    async start(streamUrl, options) {
        const { socketPath, mpvIpcArg } = getSocketPaths();
        this.socketPath = socketPath;
        // Clean up stale socket
        if (process.platform !== "win32" && (0, node_fs_1.existsSync)(socketPath)) {
            try {
                (0, node_fs_1.unlinkSync)(socketPath);
            }
            catch { }
        }
        const args = [
            "--no-config",
            `--input-ipc-server=${mpvIpcArg}`,
            "--idle",
            "--no-terminal",
            "--no-osc",
            "--no-osd-bar",
            "--keep-open=yes",
        ];
        if (options?.wid) {
            args.push(`--wid=${options.wid}`);
        }
        else {
            args.push("--force-window=yes");
        }
        console.log(`[mpv] spawning: ${this.mpvBinary}`, args);
        console.log(`[mpv] socket path: ${socketPath}`);
        this.process = (0, node_child_process_1.spawn)(this.mpvBinary, args, {
            stdio: ["ignore", "pipe", "pipe"],
        });
        console.log(`[mpv] pid: ${this.process.pid ?? "none"}`);
        this.process.on("error", (err) => {
            console.error(`[mpv] spawn error:`, err.message);
        });
        this.process.on("exit", (code, signal) => {
            console.log(`[mpv] exited code=${code} signal=${signal}`);
            this.cleanup();
            this.emit("exit", code);
        });
        this.process.stdout?.on("data", (data) => {
            const msg = data.toString().trim();
            if (msg)
                console.log(`[mpv:stdout] ${msg}`);
        });
        this.process.stderr?.on("data", (data) => {
            const msg = data.toString().trim();
            if (msg)
                console.log(`[mpv:stderr] ${msg}`);
        });
        // Wait for socket to become available
        await this.connectSocket();
        // Observe properties
        for (const prop of OBSERVED_PROPERTIES) {
            await this.observeProperty(prop);
        }
        // Load the file
        const loadArgs = ["loadfile", streamUrl];
        if (options?.startTime && options.startTime > 0) {
            loadArgs.push("replace", `start=${options.startTime}`);
        }
        await this.sendCommand(loadArgs);
    }
    async connectSocket() {
        const started = Date.now();
        let attempts = 0;
        while (Date.now() - started < MPV_CONNECT_TIMEOUT_MS) {
            if (this.destroyed) {
                throw new Error("mpv manager was destroyed before socket connected");
            }
            attempts++;
            try {
                await this.tryConnect();
                console.log(`[mpv] socket connected after ${attempts} attempts (${Date.now() - started}ms)`);
                return;
            }
            catch (err) {
                if (attempts <= 3 || attempts % 10 === 0) {
                    console.log(`[mpv] connect attempt ${attempts} failed: ${err instanceof Error ? err.message : err}`);
                }
                await new Promise((r) => setTimeout(r, MPV_CONNECT_RETRY_MS));
            }
        }
        console.error(`[mpv] gave up after ${attempts} attempts (${Date.now() - started}ms)`);
        throw new Error("Failed to connect to mpv IPC socket within timeout");
    }
    tryConnect() {
        return new Promise((resolve, reject) => {
            const socket = (0, node_net_1.createConnection)(this.socketPath);
            socket.on("connect", () => {
                this.socket = socket;
                this.setupSocketHandlers();
                resolve();
            });
            socket.on("error", (err) => {
                socket.destroy();
                reject(err);
            });
        });
    }
    setupSocketHandlers() {
        if (!this.socket)
            return;
        this.socket.on("data", (data) => {
            this.buffer += data.toString();
            const lines = this.buffer.split("\n");
            this.buffer = lines.pop() ?? "";
            for (const line of lines) {
                if (!line.trim())
                    continue;
                try {
                    const msg = JSON.parse(line);
                    this.handleMessage(msg);
                }
                catch {
                    // Ignore unparseable lines
                }
            }
        });
        this.socket.on("close", () => {
            this.socket = null;
        });
    }
    handleMessage(msg) {
        // Response to a command
        if (msg.request_id != null) {
            const pending = this.pendingRequests.get(msg.request_id);
            if (pending) {
                this.pendingRequests.delete(msg.request_id);
                if (msg.error && msg.error !== "success") {
                    pending.reject(new Error(msg.error));
                }
                else {
                    pending.resolve(msg.data);
                }
            }
            return;
        }
        // Event
        if (msg.event === "property-change" && msg.name) {
            this.emit("property-change", msg.name, msg.data);
        }
        else if (msg.event === "end-file") {
            this.emit("end-file");
        }
    }
    sendCommand(args) {
        return new Promise((resolve, reject) => {
            if (!this.socket) {
                return reject(new Error("mpv socket not connected"));
            }
            const id = ++this.requestId;
            this.pendingRequests.set(id, { resolve, reject });
            const msg = JSON.stringify({ command: args, request_id: id }) + "\n";
            this.socket.write(msg);
        });
    }
    observeProperty(name) {
        return this.sendCommand(["observe_property", 0, name]);
    }
    async play() {
        await this.sendCommand(["set_property", "pause", false]);
    }
    async pause() {
        await this.sendCommand(["set_property", "pause", true]);
    }
    async togglePause() {
        const paused = await this.sendCommand(["get_property", "pause"]);
        await this.sendCommand(["set_property", "pause", !paused]);
    }
    async seek(seconds) {
        await this.sendCommand(["seek", seconds, "relative"]);
    }
    async seekAbsolute(seconds) {
        await this.sendCommand(["seek", seconds, "absolute"]);
    }
    async setVolume(percent) {
        await this.sendCommand(["set_property", "volume", percent]);
    }
    async setMute(muted) {
        await this.sendCommand(["set_property", "mute", muted]);
    }
    async setAudioTrack(id) {
        await this.sendCommand(["set_property", "aid", id]);
    }
    async setSubtitleTrack(id) {
        await this.sendCommand(["set_property", "sid", id === false ? "no" : id]);
    }
    async getProperty(name) {
        return this.sendCommand(["get_property", name]);
    }
    async getTrackList() {
        const raw = (await this.sendCommand(["get_property", "track-list"]));
        if (!Array.isArray(raw))
            return [];
        return raw.map((t) => ({
            id: t.id,
            type: t.type,
            codec: t.codec,
            language: t.lang,
            title: t.title,
            selected: t.selected ?? false,
            default: t.default ?? false,
            external: t.external ?? false,
        }));
    }
    async quit() {
        this.destroyed = true;
        try {
            await this.sendCommand(["quit"]);
        }
        catch {
            // Process may already be dead
        }
        this.cleanup();
    }
    cleanup() {
        this.destroyed = true;
        if (this.socket) {
            this.socket.destroy();
            this.socket = null;
        }
        if (this.process && !this.process.killed) {
            this.process.kill();
        }
        this.process = null;
        this.pendingRequests.clear();
        if (process.platform !== "win32" && this.socketPath) {
            try {
                (0, node_fs_1.unlinkSync)(this.socketPath);
            }
            catch { }
        }
    }
}
exports.MpvManager = MpvManager;
//# sourceMappingURL=mpv-manager.js.map