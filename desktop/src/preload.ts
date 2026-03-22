import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true as const,

  update: {
    download(): Promise<void> { return ipcRenderer.invoke("update:download"); },
    install(): Promise<void> { return ipcRenderer.invoke("update:install"); },

    onAvailable(callback: (data: { version: string; currentVersion: string }) => void): () => void {
      const handler = (_event: Electron.IpcRendererEvent, data: { version: string; currentVersion: string }) => callback(data);
      ipcRenderer.on("update:available", handler);
      return () => { ipcRenderer.removeListener("update:available", handler); };
    },
    onDownloadProgress(callback: (data: { percent: number }) => void): () => void {
      const handler = (_event: Electron.IpcRendererEvent, data: { percent: number }) => callback(data);
      ipcRenderer.on("update:download-progress", handler);
      return () => { ipcRenderer.removeListener("update:download-progress", handler); };
    },
    onDownloaded(callback: () => void): () => void {
      const handler = () => callback();
      ipcRenderer.on("update:downloaded", handler);
      return () => { ipcRenderer.removeListener("update:downloaded", handler); };
    },
    onError(callback: (data: { message: string }) => void): () => void {
      const handler = (_event: Electron.IpcRendererEvent, data: { message: string }) => callback(data);
      ipcRenderer.on("update:error", handler);
      return () => { ipcRenderer.removeListener("update:error", handler); };
    },
  },

  window: {
    minimize(): Promise<void> { return ipcRenderer.invoke("window:minimize"); },
    maximize(): Promise<void> { return ipcRenderer.invoke("window:maximize"); },
    close(): Promise<void> { return ipcRenderer.invoke("window:close"); },
    isMaximized(): Promise<boolean> { return ipcRenderer.invoke("window:isMaximized"); },
  },

  mpv: {
    spawn(streamUrl: string, options?: { startTime?: number }): Promise<{ ok: boolean; embedded: boolean }> {
      return ipcRenderer.invoke("mpv:spawn", { streamUrl, ...options });
    },

    quit(): Promise<void> {
      return ipcRenderer.invoke("mpv:quit");
    },

    back(): Promise<void> {
      return ipcRenderer.invoke("mpv:back");
    },

    command(args: unknown[]): Promise<{ ok?: boolean; data?: unknown; error?: string }> {
      return ipcRenderer.invoke("mpv:command", args);
    },

    getProperty(name: string): Promise<unknown> {
      return ipcRenderer.invoke("mpv:get-property", name);
    },

    setProperty(name: string, value: unknown): Promise<{ ok?: boolean; error?: string }> {
      return ipcRenderer.invoke("mpv:set-property", name, value);
    },

    toggleFullscreen(): Promise<boolean> {
      return ipcRenderer.invoke("mpv:toggle-fullscreen");
    },

    isFullscreen(): Promise<boolean> {
      return ipcRenderer.invoke("mpv:is-fullscreen");
    },

    getTracks(): Promise<Array<{
      id: number;
      type: "video" | "audio" | "sub";
      title?: string;
      lang?: string;
      selected: boolean;
      codec?: string;
      external?: boolean;
    }>> {
      return ipcRenderer.invoke("mpv:get-tracks");
    },

    onBack(callback: () => void): () => void {
      const handler = () => callback();
      ipcRenderer.on("mpv:back", handler);
      return () => { ipcRenderer.removeListener("mpv:back", handler); };
    },

    onEnded(callback: () => void): () => void {
      const handler = () => callback();
      ipcRenderer.on("mpv:ended", handler);
      return () => {
        ipcRenderer.removeListener("mpv:ended", handler);
      };
    },

    onProgress(callback: (data: { currentTime: number; duration: number; paused: boolean }) => void): () => void {
      const handler = (_event: Electron.IpcRendererEvent, data: { currentTime: number; duration: number; paused: boolean }) => callback(data);
      ipcRenderer.on("mpv:progress", handler);
      return () => {
        ipcRenderer.removeListener("mpv:progress", handler);
      };
    },
  },
});
