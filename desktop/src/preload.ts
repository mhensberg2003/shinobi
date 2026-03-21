import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true as const,

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
  },
});
