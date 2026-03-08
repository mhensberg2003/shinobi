import "server-only";

import { requireMediaBackendConfig } from "./config";
import type {
  BackendAutoResolveStatus,
  BackendAutoResolvedWatch,
  BackendCachedArtifacts,
  BackendInspectedStream,
  BackendJob,
  BackendPlaybackAssessment,
  BackendWatchSession,
} from "./types";

async function backendFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const config = requireMediaBackendConfig();

  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.secret}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Media backend request failed: ${response.status} ${await response.text()}`);
  }

  return response.json() as Promise<T>;
}

export async function inspectMediaSource(input: {
  sourceUrl: string;
  torrentHash?: string;
  fileIndex?: number;
}): Promise<{
  streams: BackendInspectedStream[];
  cachedArtifacts: BackendCachedArtifacts;
  playback: BackendPlaybackAssessment;
}> {
  const payload = await backendFetch<{
    streams: BackendInspectedStream[];
    cachedArtifacts?: BackendCachedArtifacts;
    playback: BackendPlaybackAssessment;
  }>("/inspect", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return {
    streams: payload.streams,
    cachedArtifacts: payload.cachedArtifacts ?? { subtitles: {}, audio: {}, fonts: [] },
    playback: payload.playback,
  };
}

export async function createDemuxJob(input: {
  sourceUrl: string;
  torrentHash: string;
  fileIndex: number;
  subtitleTracks: Array<{ streamIndex: number; codec?: string; language?: string; label?: string }>;
  audioTracks: Array<{ streamIndex: number; codec?: string; language?: string; label?: string }>;
}): Promise<BackendJob> {
  return backendFetch<BackendJob>("/jobs/demux", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function getDemuxJob(jobId: string): Promise<BackendJob> {
  return backendFetch<BackendJob>(`/jobs/${jobId}`);
}

export async function getWatchSession(sessionKey: string): Promise<BackendWatchSession> {
  const payload = await backendFetch<{ session: BackendWatchSession }>(
    `/watch-sessions/${encodeURIComponent(sessionKey)}`,
  );

  return payload.session;
}

export async function heartbeatWatchSession(input: {
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
}): Promise<BackendWatchSession> {
  const payload = await backendFetch<{ session: BackendWatchSession }>("/watch-sessions/heartbeat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return payload.session;
}

export async function deactivateWatchSession(input: {
  sessionKey: string;
  magnetLink?: string;
  fileIndex?: number;
  torrentHash?: string;
  title?: string;
  posterUrl?: string;
  episodeNumber?: number;
  episodeTotal?: number;
  progressSeconds?: number;
  durationSeconds?: number;
}): Promise<BackendWatchSession> {
  const payload = await backendFetch<{ session: BackendWatchSession }>("/watch-sessions/deactivate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return payload.session;
}

export async function resolveWatchSession(
  sessionKey: string,
): Promise<{ session: BackendWatchSession; rehydrated: boolean }> {
  return backendFetch<{ session: BackendWatchSession; rehydrated: boolean }>("/watch-sessions/resolve", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sessionKey }),
  });
}

export async function autoResolveWatch(input: {
  requestKey?: string;
  title: string;
  alternateTitles?: string[];
  provider?: "anilist" | "tmdb";
  mediaId?: string;
  kind?: "anime" | "movie" | "show";
  posterUrl?: string;
  episodeNumber?: number;
  episodeTotal?: number;
  year?: number;
}): Promise<BackendAutoResolvedWatch> {
  return backendFetch<BackendAutoResolvedWatch>("/watch/auto-resolve", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function getAutoResolveStatus(requestKey: string): Promise<BackendAutoResolveStatus> {
  const payload = await backendFetch<{ status: BackendAutoResolveStatus }>(
    `/watch/auto-resolve/status?requestKey=${encodeURIComponent(requestKey)}`,
  );

  return payload.status;
}
