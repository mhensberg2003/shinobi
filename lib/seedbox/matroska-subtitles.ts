import "server-only";

import { Readable } from "node:stream";

import { SubtitleParser } from "matroska-subtitles";

import { requireSeedboxConfig } from "./config";

type MatroskaTrack = {
  number: number;
  language?: string;
  type?: string;
  name?: string;
};

type ParsedSubtitle = {
  text: string;
  time: number;
  duration: number;
};

export type ExtractedSubtitleTrack = {
  index: number;
  label: string;
  src: string;
  language?: string;
  format?: string;
  supported?: boolean;
};

const subtitleTrackCache = new Map<string, Promise<ExtractedSubtitleTrack[]>>();
const subtitleVttCache = new Map<string, Promise<string>>();
const subtitleDebugEnabled = process.env.SUBTITLE_DEBUG === "1";
const TRACK_LIST_TIMEOUT_MS = 5_000;
const VTT_EXTRACTION_TIMEOUT_MS = 15_000;

function logSubtitleDebug(event: string, details: Record<string, unknown>) {
  if (!subtitleDebugEnabled) {
    return;
  }

  console.info("[shinobi:subtitles]", event, details);
}

function getStreamToken(streamUrl: string): string | null {
  try {
    const url = new URL(streamUrl, "http://localhost");
    return url.pathname === "/api/stream" ? url.searchParams.get("url") : null;
  } catch {
    return null;
  }
}

function decodeTargetUrl(streamUrl: string): string | null {
  const token = getStreamToken(streamUrl);
  if (!token) return null;

  try {
    return Buffer.from(token, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

async function fetchAuthenticatedMatroskaStream(streamUrl: string, signal?: AbortSignal) {
  const targetUrl = decodeTargetUrl(streamUrl);
  if (!targetUrl) {
    throw new Error("Expected an internal /api/stream URL with an encoded seedbox target.");
  }

  const config = requireSeedboxConfig();
  const auth = Buffer.from(`${config.username}:${config.password}`).toString("base64");
  const upstream = await fetch(targetUrl, {
    headers: { Authorization: `Basic ${auth}` },
    signal,
  });

  if (!upstream.ok || !upstream.body) {
    throw new Error(`Failed to fetch Matroska stream (${upstream.status}).`);
  }

  return upstream;
}

function buildTrackLabel(track: MatroskaTrack, fallbackIndex: number) {
  const parts = [track.name, track.language, track.type?.toUpperCase()].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : `Embedded subtitle ${fallbackIndex + 1}`;
}

function toWebVttTimestamp(ms: number) {
  const clamped = Math.max(0, Math.floor(ms));
  const hours = Math.floor(clamped / 3_600_000);
  const minutes = Math.floor((clamped % 3_600_000) / 60_000);
  const seconds = Math.floor((clamped % 60_000) / 1_000);
  const millis = clamped % 1_000;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

function normalizeCueText(text: string) {
  return text
    .replace(/\{[^}]*\}/g, "")
    .replace(/\\N/gi, "\n")
    .replace(/\\n/g, "\n")
    .trim();
}

function buildVttCue(cueIndex: number, subtitle: ParsedSubtitle) {
  const start = toWebVttTimestamp(subtitle.time);
  const end = toWebVttTimestamp(subtitle.time + subtitle.duration);
  const text = normalizeCueText(subtitle.text);

  if (!text) return "";

  return `${cueIndex}\n${start} --> ${end}\n${text}\n\n`;
}

export async function listMatroskaSubtitleTracks(streamUrl: string): Promise<ExtractedSubtitleTrack[]> {
  const token = getStreamToken(streamUrl);
  if (!token) return [];

  const cacheKey = token;
  const cached = subtitleTrackCache.get(cacheKey);
  if (cached) {
    logSubtitleDebug("track-list-cache-hit", { cacheKey: cacheKey.slice(0, 18) });
    return cached;
  }

  const pending = (async () => {
    const startedAt = Date.now();
    const abortController = new AbortController();
    logSubtitleDebug("track-list-start", {
      cacheKey: cacheKey.slice(0, 18),
      targetUrl: decodeTargetUrl(streamUrl),
    });
    const upstream = await fetchAuthenticatedMatroskaStream(streamUrl, abortController.signal);
    const parser = new SubtitleParser();
    const stream = Readable.fromWeb(
      upstream.body as unknown as import("node:stream/web").ReadableStream<Uint8Array>,
    );

    return await new Promise<ExtractedSubtitleTrack[]>((resolve, reject) => {
      let settled = false;
      const timeout = setTimeout(() => {
        finalizeReject(new Error(`Timed out listing Matroska subtitle tracks after ${TRACK_LIST_TIMEOUT_MS}ms.`));
      }, TRACK_LIST_TIMEOUT_MS);

      const finalizeResolve = (tracks: ExtractedSubtitleTrack[]) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        abortController.abort();
        stream.destroy();
        resolve(tracks);
      };

      const finalizeReject = (error: unknown) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        abortController.abort();
        stream.destroy(error instanceof Error ? error : undefined);
        reject(error);
      };

      parser.once("tracks", (tracks: MatroskaTrack[]) => {
        logSubtitleDebug("track-list-success", {
          cacheKey: cacheKey.slice(0, 18),
          trackCount: tracks.length,
          durationMs: Date.now() - startedAt,
          tracks: tracks.map((track) => ({
            number: track.number,
            language: track.language,
            type: track.type,
            name: track.name,
          })),
        });
        finalizeResolve(
          tracks.map((track, index) => ({
            index: 100_000 + track.number,
            label: buildTrackLabel(track, index),
            src: `/api/subtitles/matroska?url=${encodeURIComponent(token)}&track=${track.number}`,
            language: track.language,
            format: track.type,
            supported: track.type === "utf8",
          })),
        );
      });

      parser.once("error", finalizeReject);
      stream.once("error", (error) => {
        if (settled && error instanceof Error && error.name === "AbortError") return;
        finalizeReject(error);
      });
      stream.once("end", () => finalizeResolve([]));

      stream.pipe(parser);
    });
  })().catch((error) => {
    logSubtitleDebug("track-list-error", {
      cacheKey: cacheKey.slice(0, 18),
      message: error instanceof Error ? error.message : String(error),
    });
    subtitleTrackCache.delete(cacheKey);
    throw error;
  });

  subtitleTrackCache.set(cacheKey, pending);
  return pending;
}

export async function extractMatroskaSubtitleTrackAsVtt(streamUrl: string, trackNumber: number): Promise<string> {
  const token = getStreamToken(streamUrl);
  if (!token) {
    throw new Error("Expected an internal /api/stream URL with an encoded seedbox target.");
  }

  const cacheKey = `${token}:${trackNumber}`;
  const cached = subtitleVttCache.get(cacheKey);
  if (cached) {
    logSubtitleDebug("vtt-cache-hit", { cacheKey: cacheKey.slice(0, 18), trackNumber });
    return cached;
  }

  const pending = (async () => {
    const startedAt = Date.now();
    const abortController = new AbortController();
    logSubtitleDebug("vtt-start", {
      cacheKey: cacheKey.slice(0, 18),
      trackNumber,
      targetUrl: decodeTargetUrl(streamUrl),
    });
    const upstream = await fetchAuthenticatedMatroskaStream(streamUrl, abortController.signal);
    const parser = new SubtitleParser();
    const stream = Readable.fromWeb(
      upstream.body as unknown as import("node:stream/web").ReadableStream<Uint8Array>,
    );

    return await new Promise<string>((resolve, reject) => {
      let settled = false;
      let foundTrack = false;
      const cues: string[] = [];
      let cueIndex = 1;
      const timeout = setTimeout(() => {
        finalizeReject(
          new Error(`Timed out extracting subtitle track ${trackNumber} after ${VTT_EXTRACTION_TIMEOUT_MS}ms.`),
        );
      }, VTT_EXTRACTION_TIMEOUT_MS);

      const finalizeReject = (error: unknown) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        abortController.abort();
        stream.destroy(error instanceof Error ? error : undefined);
        reject(error);
      };

      const finalizeResolve = (vtt: string) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        abortController.abort();
        stream.destroy();
        resolve(vtt);
      };

      parser.once("tracks", (tracks: MatroskaTrack[]) => {
        foundTrack = tracks.some((track) => track.number === trackNumber);
      });

      parser.on("subtitle", (subtitle: ParsedSubtitle, emittedTrackNumber: number) => {
        if (emittedTrackNumber !== trackNumber) return;
        const cue = buildVttCue(cueIndex, subtitle);
        if (!cue) return;
        cues.push(cue);
        cueIndex += 1;
      });

      parser.once("error", finalizeReject);
      stream.once("error", (error) => {
        if (error instanceof Error && error.name === "AbortError") return;
        finalizeReject(error);
      });
      stream.once("end", () => {
        if (!foundTrack) {
          finalizeReject(new Error(`Subtitle track ${trackNumber} was not found in the Matroska stream.`));
          return;
        }

        logSubtitleDebug("vtt-success", {
          cacheKey: cacheKey.slice(0, 18),
          trackNumber,
          cueCount: cueIndex - 1,
          durationMs: Date.now() - startedAt,
        });
        finalizeResolve(`WEBVTT\n\n${cues.join("")}`);
      });

      stream.pipe(parser);
    });
  })().catch((error) => {
    logSubtitleDebug("vtt-error", {
      cacheKey: cacheKey.slice(0, 18),
      trackNumber,
      message: error instanceof Error ? error.message : String(error),
    });
    subtitleVttCache.delete(cacheKey);
    throw error;
  });

  subtitleVttCache.set(cacheKey, pending);
  return pending;
}
