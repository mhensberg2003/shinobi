import { contextBridge, ipcRenderer } from "electron";

export type MpvTrack = {
  id: number;
  type: "video" | "audio" | "sub";
  codec?: string;
  language?: string;
  title?: string;
  selected: boolean;
  default: boolean;
  external: boolean;
};

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true as const,

  mpv: {
    spawn(streamUrl: string, options?: { startTime?: number }): Promise<MpvTrack[]> {
      return ipcRenderer.invoke("mpv:spawn", { streamUrl, ...options });
    },

    play(): Promise<void> {
      return ipcRenderer.invoke("mpv:command", "play");
    },
    pause(): Promise<void> {
      return ipcRenderer.invoke("mpv:command", "pause");
    },
    togglePause(): Promise<void> {
      return ipcRenderer.invoke("mpv:command", "toggle-pause");
    },
    seek(seconds: number): Promise<void> {
      return ipcRenderer.invoke("mpv:command", "seek", seconds);
    },
    seekAbsolute(seconds: number): Promise<void> {
      return ipcRenderer.invoke("mpv:command", "seek-absolute", seconds);
    },
    setVolume(percent: number): Promise<void> {
      return ipcRenderer.invoke("mpv:command", "set-volume", percent);
    },
    setMute(muted: boolean): Promise<void> {
      return ipcRenderer.invoke("mpv:command", "set-mute", muted);
    },
    setAudioTrack(id: number): Promise<void> {
      return ipcRenderer.invoke("mpv:command", "set-audio-track", id);
    },
    setSubtitleTrack(id: number | false): Promise<void> {
      return ipcRenderer.invoke("mpv:command", "set-subtitle-track", id);
    },
    getProperty(name: string): Promise<unknown> {
      return ipcRenderer.invoke("mpv:command", "get-property", name);
    },
    getTrackList(): Promise<MpvTrack[]> {
      return ipcRenderer.invoke("mpv:command", "get-track-list");
    },
    quit(): Promise<void> {
      return ipcRenderer.invoke("mpv:quit");
    },

    onPropertyChange(callback: (prop: string, value: unknown) => void): () => void {
      const handler = (_event: Electron.IpcRendererEvent, prop: string, value: unknown) => {
        callback(prop, value);
      };
      ipcRenderer.on("mpv:property-change", handler);
      return () => {
        ipcRenderer.removeListener("mpv:property-change", handler);
      };
    },

    onEndFile(callback: () => void): () => void {
      const handler = () => callback();
      ipcRenderer.on("mpv:end-file", handler);
      return () => {
        ipcRenderer.removeListener("mpv:end-file", handler);
      };
    },
  },
});
