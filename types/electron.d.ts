interface ElectronMpvAPI {
  spawn(streamUrl: string, options?: { startTime?: number }): Promise<{ ok: boolean }>;
  quit(): Promise<void>;
  onEnded(callback: () => void): () => void;
  onProgress(callback: (data: { currentTime: number; duration: number }) => void): () => void;
}

interface Window {
  electronAPI?: {
    isElectron: true;
    mpv: ElectronMpvAPI;
  };
}
