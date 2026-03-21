interface MpvTrack {
  id: number;
  type: "video" | "audio" | "sub";
  codec?: string;
  language?: string;
  title?: string;
  selected: boolean;
  default: boolean;
  external: boolean;
}

interface ElectronMpvAPI {
  spawn(streamUrl: string, options?: { startTime?: number }): Promise<MpvTrack[]>;
  play(): Promise<void>;
  pause(): Promise<void>;
  togglePause(): Promise<void>;
  seek(seconds: number): Promise<void>;
  seekAbsolute(seconds: number): Promise<void>;
  setVolume(percent: number): Promise<void>;
  setMute(muted: boolean): Promise<void>;
  setAudioTrack(id: number): Promise<void>;
  setSubtitleTrack(id: number | false): Promise<void>;
  getProperty(name: string): Promise<unknown>;
  getTrackList(): Promise<MpvTrack[]>;
  quit(): Promise<void>;
  onPropertyChange(callback: (prop: string, value: unknown) => void): () => void;
  onEndFile(callback: () => void): () => void;
}

interface Window {
  electronAPI?: {
    isElectron: true;
    mpv: ElectronMpvAPI;
  };
}
