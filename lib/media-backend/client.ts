import "server-only";

import { requireMediaBackendConfig } from "./config";
import type { BackendInspectedStream, BackendJob, BackendWatchSession } from "./types";

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

export async function inspectMediaSource(sourceUrl: string): Promise<BackendInspectedStream[]> {
  const payload = await backendFetch<{ streams: BackendInspectedStream[] }>("/inspect", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sourceUrl }),
  });

  return payload.streams;
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
