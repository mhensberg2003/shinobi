import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true as const,

  window: {
    minimize(): Promise<void> { return ipcRenderer.invoke("window:minimize"); },
    maximize(): Promise<void> { return ipcRenderer.invoke("window:maximize"); },
    close(): Promise<void> { return ipcRenderer.invoke("window:close"); },
    isMaximized(): Promise<boolean> { return ipcRenderer.invoke("window:isMaximized"); },
  },

  mpv: {
    spawn(streamUrl: string, options?: { startTime?: number }): Promise<{ ok: boolean }> {
      return ipcRenderer.invoke("mpv:spawn", { streamUrl, ...options });
    },

    quit(): Promise<void> {
      return ipcRenderer.invoke("mpv:quit");
    },

    onEnded(callback: () => void): () => void {
      const handler = () => callback();
      ipcRenderer.on("mpv:ended", handler);
      return () => {
        ipcRenderer.removeListener("mpv:ended", handler);
      };
    },

    onProgress(callback: (data: { currentTime: number; duration: number }) => void): () => void {
      const handler = (_event: Electron.IpcRendererEvent, data: { currentTime: number; duration: number }) => callback(data);
      ipcRenderer.on("mpv:progress", handler);
      return () => {
        ipcRenderer.removeListener("mpv:progress", handler);
      };
    },
  },
});
