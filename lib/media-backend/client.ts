import "server-only";

import { requireMediaBackendConfig } from "./config";
import type { BackendInspectedStream, BackendJob } from "./types";

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
