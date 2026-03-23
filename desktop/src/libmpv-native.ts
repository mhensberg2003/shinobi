import { existsSync } from "node:fs";
import path from "node:path";

type NativeLibMpvAddon = {
  createPlayer(handle: string): number;
  loadFile(playerId: number, url: string, startTime?: number): void;
  command(playerId: number, args: unknown[]): unknown;
  getProperty(playerId: number, name: string): unknown;
  setProperty(playerId: number, name: string, value: unknown): void;
  destroyPlayer(playerId: number): void;
  isAlive(playerId: number): boolean;
};

let cachedAddon: NativeLibMpvAddon | null = null;

function resolveAddonPath(): string {
  if (typeof process.resourcesPath === "string") {
    const unpackedPath = path.join(process.resourcesPath, "app.asar.unpacked", "native", "build", "libmpv_renderer.node");
    if (existsSync(unpackedPath)) {
      return unpackedPath;
    }
  }

  return path.join(__dirname, "../native/build/libmpv_renderer.node");
}

export function hasLibMpvAddon(): boolean {
  if (process.platform !== "darwin") {
    return false;
  }

  return existsSync(resolveAddonPath());
}

export function getLibMpvAddon(): NativeLibMpvAddon {
  if (!hasLibMpvAddon()) {
    throw new Error("libmpv native addon is not available on this macOS build");
  }

  if (!cachedAddon) {
    cachedAddon = require(resolveAddonPath()) as NativeLibMpvAddon;
  }

  return cachedAddon;
}
