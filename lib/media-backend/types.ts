export type BackendInspectedStream = {
  streamIndex: number;
  kind: "subtitle" | "audio" | "video";
  codecName?: string;
  codecLongName?: string;
  language?: string;
  label?: string;
  pixelFormat?: string;
  profile?: string;
};

export type BackendPlaybackAssessment = {
  directPlayLikely: boolean;
  reason?: string;
  videoStream?: BackendInspectedStream;
  audioStream?: BackendInspectedStream;
};

export type BackendCachedArtifacts = {
  subtitles: Record<number, string>;
  audio: Record<number, string>;
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
  sourceProvider?: "seedbox" | "realdebrid";
  sourceId?: string;
  sourceLink?: string;
  sourceUrl?: string;
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

export type BackendAutoResolvedWatch = {
  session: BackendWatchSession;
  candidate: {
    title: string;
    link: string;
    magnetLink: string;
    seeders: number;
    leechers: number;
    downloads: number;
    score: number;
    reasons: string[];
  };
  filePath: string;
};

export type BackendAutoResolveStatus = {
  requestKey: string;
  phase:
    | "queued"
    | "searching"
    | "ranking"
    | "trying-candidate"
    | "fetching-metadata"
    | "picking-file"
    | "selecting-file"
    | "waiting-for-playable"
    | "buffering"
    | "probing"
    | "finalizing"
    | "completed"
    | "failed";
  message: string;
  startedAt: string;
  updatedAt: string;
  title?: string;
  provider?: "anilist" | "tmdb";
  kind?: "anime" | "movie" | "show";
  episodeNumber?: number;
  candidate?: {
    title: string;
    score?: number;
    seeders?: number;
  };
  torrentHash?: string;
  fileIndex?: number;
  resolution?: BackendAutoResolvedWatch;
  error?: string;
};
