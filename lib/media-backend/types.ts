export type BackendInspectedStream = {
  streamIndex: number;
  kind: "subtitle" | "audio";
  codecName?: string;
  codecLongName?: string;
  language?: string;
  label?: string;
};

export type BackendJob = {
  id: string;
  status: "queued" | "running" | "completed" | "failed";
  createdAt: string;
  updatedAt: string;
  sourceUrl: string;
  torrentHash: string;
  fileIndex: number;
  subtitleTracks: Array<{ streamIndex: number; codec?: string; language?: string; label?: string }>;
  audioTracks: Array<{ streamIndex: number; codec?: string; language?: string; label?: string }>;
  output?: {
    subtitles: string[];
    audio: string[];
    inspectedStreams: BackendInspectedStream[];
  };
  error?: string;
};

export type BackendWatchSession = {
  sessionKey: string;
  magnetLink: string;
  fileIndex: number;
  torrentHash?: string;
  title?: string;
  posterUrl?: string;
  episodeNumber?: number;
  episodeTotal?: number;
  progressSeconds?: number;
  durationSeconds?: number;
  activeInPlayer: boolean;
  createdAt: string;
  updatedAt: string;
  lastHeartbeatAt: string;
  cleanupAfter: string;
  removedAt?: string;
};
