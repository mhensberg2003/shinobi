import { ChildProcess, spawn } from "node:child_process";
import { createConnection, Socket } from "node:net";
import { EventEmitter } from "node:events";
import { existsSync, unlinkSync } from "node:fs";
import path from "node:path";
import os from "node:os";

type MpvTrack = {
  id: number;
  type: "video" | "audio" | "sub";
  codec?: string;
  language?: string;
  title?: string;
  selected: boolean;
  default: boolean;
  external: boolean;
};

const SOCKET_PATH =
  process.platform === "win32"
    ? `\\\\.\\pipe\\shinobi-mpv-${process.pid}`
    : path.join(os.tmpdir(), `shinobi-mpv-${process.pid}.sock`);
const OBSERVED_PROPERTIES = ["time-pos", "duration", "pause", "volume", "mute", "track-list", "eof-reached"];
const MPV_CONNECT_TIMEOUT_MS = 10000;
const MPV_CONNECT_RETRY_MS = 200;

export class MpvManager extends EventEmitter {
  private process: ChildProcess | null = null;
  private socket: Socket | null = null;
  private requestId = 0;
  private pendingRequests = new Map<number, { resolve: (value: unknown) => void; reject: (err: Error) => void }>();
  private buffer = "";
  private mpvBinary: string;

  constructor(mpvBinary = "mpv") {
    super();
    this.mpvBinary = mpvBinary;
  }

  async start(streamUrl: string, options?: { startTime?: number }): Promise<void> {
    // Clean up stale socket
    if (existsSync(SOCKET_PATH)) {
      if (process.platform !== "win32") { try { unlinkSync(SOCKET_PATH); } catch {} }
    }

    const args = [
      `--input-ipc-server=${SOCKET_PATH}`,
      "--idle=once",
      "--no-terminal",
      "--no-osc",
      "--no-osd-bar",
      "--keep-open=yes",
      "--force-window=no"
    ];

    console.log(`[mpv] spawning: ${this.mpvBinary}`, args);
    console.log(`[mpv] socket path: ${SOCKET_PATH}`);

    this.process = spawn(this.mpvBinary, args, {
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

    this.process.stdout?.on("data", (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) console.log(`[mpv:stdout] ${msg}`);
    });

    this.process.stderr?.on("data", (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) console.log(`[mpv:stderr] ${msg}`);
    });

    // Wait for socket to become available
    await this.connectSocket();

    // Observe properties
    for (const prop of OBSERVED_PROPERTIES) {
      await this.observeProperty(prop);
    }

    // Load the file
    const loadArgs: string[] = ["loadfile", streamUrl];
    if (options?.startTime && options.startTime > 0) {
      loadArgs.push("replace", `start=${options.startTime}`);
    }
    await this.sendCommand(loadArgs);
  }

  private async connectSocket(): Promise<void> {
    const started = Date.now();
    let attempts = 0;

    while (Date.now() - started < MPV_CONNECT_TIMEOUT_MS) {
      attempts++;
      try {
        await this.tryConnect();
        console.log(`[mpv] socket connected after ${attempts} attempts (${Date.now() - started}ms)`);
        return;
      } catch (err) {
        if (attempts <= 3 || attempts % 10 === 0) {
          console.log(`[mpv] connect attempt ${attempts} failed: ${err instanceof Error ? err.message : err}`);
        }
        await new Promise((r) => setTimeout(r, MPV_CONNECT_RETRY_MS));
      }
    }

    console.error(`[mpv] gave up after ${attempts} attempts (${Date.now() - started}ms)`);
    throw new Error("Failed to connect to mpv IPC socket within timeout");
  }

  private tryConnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = createConnection(SOCKET_PATH);

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

  private setupSocketHandlers() {
    if (!this.socket) return;

    this.socket.on("data", (data: Buffer) => {
      this.buffer += data.toString();
      const lines = this.buffer.split("\n");
      this.buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);
          this.handleMessage(msg);
        } catch {
          // Ignore unparseable lines
        }
      }
    });

    this.socket.on("close", () => {
      this.socket = null;
    });
  }

  private handleMessage(msg: { request_id?: number; error?: string; data?: unknown; event?: string; name?: string }) {
    // Response to a command
    if (msg.request_id != null) {
      const pending = this.pendingRequests.get(msg.request_id);
      if (pending) {
        this.pendingRequests.delete(msg.request_id);
        if (msg.error && msg.error !== "success") {
          pending.reject(new Error(msg.error));
        } else {
          pending.resolve(msg.data);
        }
      }
      return;
    }

    // Event
    if (msg.event === "property-change" && msg.name) {
      this.emit("property-change", msg.name, msg.data);
    } else if (msg.event === "end-file") {
      this.emit("end-file");
    }
  }

  private sendCommand(args: unknown[]): Promise<unknown> {
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

  private observeProperty(name: string): Promise<unknown> {
    return this.sendCommand(["observe_property", 0, name]);
  }

  async play(): Promise<void> {
    await this.sendCommand(["set_property", "pause", false]);
  }

  async pause(): Promise<void> {
    await this.sendCommand(["set_property", "pause", true]);
  }

  async togglePause(): Promise<void> {
    const paused = await this.sendCommand(["get_property", "pause"]);
    await this.sendCommand(["set_property", "pause", !paused]);
  }

  async seek(seconds: number): Promise<void> {
    await this.sendCommand(["seek", seconds, "relative"]);
  }

  async seekAbsolute(seconds: number): Promise<void> {
    await this.sendCommand(["seek", seconds, "absolute"]);
  }

  async setVolume(percent: number): Promise<void> {
    await this.sendCommand(["set_property", "volume", percent]);
  }

  async setMute(muted: boolean): Promise<void> {
    await this.sendCommand(["set_property", "mute", muted]);
  }

  async setAudioTrack(id: number): Promise<void> {
    await this.sendCommand(["set_property", "aid", id]);
  }

  async setSubtitleTrack(id: number | false): Promise<void> {
    await this.sendCommand(["set_property", "sid", id === false ? "no" : id]);
  }

  async getProperty(name: string): Promise<unknown> {
    return this.sendCommand(["get_property", name]);
  }

  async getTrackList(): Promise<MpvTrack[]> {
    const raw = (await this.sendCommand(["get_property", "track-list"])) as Array<{
      id: number;
      type: string;
      codec?: string;
      lang?: string;
      title?: string;
      selected?: boolean;
      default?: boolean;
      external?: boolean;
    }>;

    if (!Array.isArray(raw)) return [];

    return raw.map((t) => ({
      id: t.id,
      type: t.type as MpvTrack["type"],
      codec: t.codec,
      language: t.lang,
      title: t.title,
      selected: t.selected ?? false,
      default: t.default ?? false,
      external: t.external ?? false,
    }));
  }

  async quit(): Promise<void> {
    try {
      await this.sendCommand(["quit"]);
    } catch {
      // Process may already be dead
    }
    this.cleanup();
  }

  private cleanup() {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
    if (this.process && !this.process.killed) {
      this.process.kill();
    }
    this.process = null;
    this.pendingRequests.clear();

    if (process.platform !== "win32") { try { unlinkSync(SOCKET_PATH); } catch {} }
  }
}
