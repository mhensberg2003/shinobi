interface ElectronMpvAPI {
  spawn(streamUrl: string, options?: { startTime?: number }): Promise<{ ok: boolean }>;
  quit(): Promise<void>;
  onEnded(callback: () => void): () => void;
  onProgress(callback: (data: { currentTime: number; duration: number }) => void): () => void;
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
