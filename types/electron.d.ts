interface MpvTrack {
  id: number;
  type: "video" | "audio" | "sub";
  title?: string;
  lang?: string;
  selected: boolean;
  codec?: string;
  external?: boolean;
}

interface ElectronMpvAPI {
  spawn(streamUrl: string, options?: { startTime?: number }): Promise<{ ok: boolean; embedded: boolean }>;
  quit(): Promise<void>;
  back(): Promise<void>;
  command(args: unknown[]): Promise<{ ok?: boolean; data?: unknown; error?: string }>;
  getProperty(name: string): Promise<unknown>;
  setProperty(name: string, value: unknown): Promise<{ ok?: boolean; error?: string }>;
  toggleFullscreen(): Promise<boolean>;
  isFullscreen(): Promise<boolean>;
  getTracks(): Promise<MpvTrack[]>;
  onBack(callback: () => void): () => void;
  onEnded(callback: () => void): () => void;
  onProgress(callback: (data: { currentTime: number; duration: number; paused: boolean }) => void): () => void;
}

interface ElectronWindowAPI {
  minimize(): Promise<void>;
  maximize(): Promise<void>;
  close(): Promise<void>;
  isMaximized(): Promise<boolean>;
}

interface Window {
  electronAPI?: {
    isElectron: true;
    window: ElectronWindowAPI;
    mpv: ElectronMpvAPI;
  };
}
