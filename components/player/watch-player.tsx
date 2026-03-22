"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
type AssRendererInstance = {
  destroy(): void;
};
type JassubCtor = new (opts: {
  video: HTMLVideoElement;
  canvas: HTMLCanvasElement;
  subContent: string;
  workerUrl: string;
  wasmUrl: string;
  modernWasmUrl?: string;
  resampling?: "video_width" | "video_height" | "script_width" | "script_height";
}) => AssRendererInstance;
type PgsRendererInstance = { dispose(): void; renderAtTimestamp(ts: number): void };
type PgsRendererCtor = new (opts: Record<string, unknown>) => PgsRendererInstance;

// Opaque to TypeScript's module resolver and runtime-bundled separately.
// eslint-disable-next-line @typescript-eslint/no-implied-eval
const loadUrl = new Function("url", "return import(url)") as <T>(url: string) => Promise<T>;

type SubtitleTrack = {
  index: number;
  label: string;
  src: string;
  language?: string;
  default?: boolean;
  format?: "text" | "pgs" | "ass";
};
type AudioTrackOption = { id: number; label: string; language?: string };
type PlayerTextTrackOption = { id: number; label: string; language?: string; kind: string };
type BackendTrackOption = {
  id: number;
  label: string;
  language?: string;
  status?: string;
  state?: "idle" | "running" | "completed" | "failed";
  actionLabel?: string;
};

type WatchPlayerProps = {
  resumeTime?: number;
  sessionKey?: string;
  title: string;
  streamUrl: string;
  posterUrl?: string;
  episodeNumber?: number;
  episodeTotal?: number;
  magnetLink?: string;
  torrentHash: string;
  fileIndex: number;
  subtitles: SubtitleTrack[];
  backendSubtitleOptions?: BackendTrackOption[];
  backendAudioOptions?: BackendTrackOption[];
  onExtractSubtitle?: (id: number) => void;
  onDisableSubtitle?: () => void;
  onExtractAudio?: (id: number) => void;
  preferredSubtitleLabel?: string | null;
  subtitleLoadingLabel?: string | null;
  externalAudioTracks?: Array<{ id: number; label: string; src: string; language?: string }>;
  selectedExternalAudioId?: number | null;
  onSelectExternalAudio?: (id: number | null) => void;
  audioLoadingLabel?: string | null;
  audioLoadingMode?: "extract" | "transcode" | null;
  restrictForwardSeeksToBuffered?: boolean;
};


type HTMLVideoElementWithAudioTracks = HTMLVideoElement & {
  audioTracks?: ArrayLike<{ enabled: boolean; label?: string; language?: string }> & EventTarget;
};
const KEYBOARD_SEEK_SECONDS = 10;
const SEEK_BUFFER_MARGIN_SECONDS = 5;
const subtitleDebugEnabled = process.env.NEXT_PUBLIC_SUBTITLE_DEBUG === "1";

function logSubtitleDebug(event: string, details: Record<string, unknown>) {
  if (!subtitleDebugEnabled) {
    return;
  }

  console.info("[shinobi:player:subtitles]", event, details);
}

function fmt(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const t = Math.floor(s);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const sec = t % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}



function waitForAudioReady(audio: HTMLAudioElement, timeoutMs = 15_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error("Timed out while loading external audio."));
    }, timeoutMs);

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      audio.removeEventListener("loadedmetadata", onReady);
      audio.removeEventListener("canplay", onReady);
      audio.removeEventListener("error", onError);
    };

    const onReady = () => {
      cleanup();
      resolve();
    };

    const onError = () => {
      cleanup();
      reject(new Error("The selected external audio track could not be loaded."));
    };

    audio.addEventListener("loadedmetadata", onReady);
    audio.addEventListener("canplay", onReady);
    audio.addEventListener("error", onError);
  });
}

async function safePlay(
  media: HTMLMediaElement,
  context: string,
  details: Record<string, unknown> = {},
): Promise<boolean> {
  try {
    await media.play();
    return true;
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === "AbortError" || error.name === "NotAllowedError")
    ) {
      console.info("[shinobi:player] play interrupted", {
        context,
        error: error.name,
        ...details,
      });
      return false;
    }

    console.warn("[shinobi:player] play failed", {
      context,
      error: error instanceof Error ? error.message : String(error),
      ...details,
    });
    return false;
  }
}


function sendClientDebug(scope: string, message: string, details: Record<string, unknown> = {}) {
  try {
    void fetch("/api/debug/client-log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ scope, message, details }),
      keepalive: true,
    });
  } catch {}
}

async function logAssRuntimePreflight(
  workerUrl: string,
  wasmUrl: string,
  modernWasmUrl: string,
): Promise<void> {
  const features = {
    crossOriginIsolated: globalThis.crossOriginIsolated ?? false,
    hasSharedArrayBuffer: typeof SharedArrayBuffer !== "undefined",
    hasOffscreenCanvas: typeof OffscreenCanvas !== "undefined",
    hasTransferControlToOffscreen:
      typeof HTMLCanvasElement !== "undefined" &&
      "transferControlToOffscreen" in HTMLCanvasElement.prototype,
    hasRequestVideoFrameCallback:
      typeof HTMLVideoElement !== "undefined" &&
      "requestVideoFrameCallback" in HTMLVideoElement.prototype,
  };

  console.info("[shinobi:player] ass runtime features", features);

  const urls = [
    { kind: "worker", url: workerUrl },
    { kind: "wasm", url: wasmUrl },
    { kind: "modernWasm", url: modernWasmUrl },
  ];

  await Promise.all(
    urls.map(async ({ kind, url }) => {
      try {
        const response = await fetch(url, { cache: "no-store" });
        console.info("[shinobi:player] ass runtime preflight", {
          kind,
          url,
          ok: response.ok,
          status: response.status,
          contentType: response.headers.get("content-type"),
        });
      } catch (error) {
        console.warn("[shinobi:player] ass runtime preflight failed", {
          kind,
          url,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }),
  );
}

type AssDialogueSample = {
  startSeconds: number;
  endSeconds: number;
  text: string;
};

function parseAssTimestamp(value: string): number | null {
  const match = value.trim().match(/^(\d+):(\d{2}):(\d{2})[.](\d{2})$/);
  if (!match) {
    return null;
  }

  const [, hours, minutes, seconds, centiseconds] = match;
  return (
    Number(hours) * 3600 +
    Number(minutes) * 60 +
    Number(seconds) +
    Number(centiseconds) / 100
  );
}

function getAssDialogueSamples(subtitleContent: string, currentTime: number): {
  active: AssDialogueSample[];
  nearby: AssDialogueSample[];
} {
  const dialogues: AssDialogueSample[] = [];

  for (const line of subtitleContent.split(/\r?\n/)) {
    if (!line.startsWith("Dialogue:")) {
      continue;
    }

    const parts = line.split(",", 10);
    if (parts.length < 10) {
      continue;
    }

    const startSeconds = parseAssTimestamp(parts[1] ?? "");
    const endSeconds = parseAssTimestamp(parts[2] ?? "");
    if (startSeconds == null || endSeconds == null) {
      continue;
    }

    dialogues.push({
      startSeconds,
      endSeconds,
      text: (parts[9] ?? "").replace(/\\N/g, " ").slice(0, 120),
    });
  }

  return {
    active: dialogues
      .filter((dialogue) => currentTime >= dialogue.startSeconds && currentTime <= dialogue.endSeconds)
      .slice(0, 5),
    nearby: dialogues
      .filter(
        (dialogue) =>
          Math.abs(dialogue.startSeconds - currentTime) <= 10 ||
          Math.abs(dialogue.endSeconds - currentTime) <= 10,
      )
      .slice(0, 5),
  };
}

function isKeyboardShortcutTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return true;
  }

  if (target.isContentEditable) {
    return false;
  }

  const tagName = target.tagName;
  if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") {
    return false;
  }

  return true;
}

// SVG icons
function IconPlay({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  );
}
function IconPause({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}
function IconVolume({ muted, size = 20 }: { muted: boolean; size?: number }) {
  if (muted) return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97V10.18L16.45 12.63C16.48 12.43 16.5 12.22 16.5 12ZM19 12C19 12.94 18.8 13.82 18.46 14.64L19.97 16.15C20.62 14.91 21 13.5 21 12C21 7.72 18.01 4.14 14 3.23V5.29C16.89 6.15 19 8.83 19 12ZM4.27 3L3 4.27 7.73 9H3V15H7L12 20V13.27L16.25 17.52C15.58 18.04 14.83 18.45 14 18.7V20.76C15.38 20.45 16.63 19.82 17.68 18.96L19.73 21 21 19.73 12 10.73 4.27 3ZM12 4L9.91 6.09 12 8.18V4Z"/>
    </svg>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
    </svg>
  );
}
function IconCC({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 4H5C3.89 4 3 4.9 3 6v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1c0 .55-.45 1-1 1h-3c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1z"/>
    </svg>
  );
}
function IconFullscreen({ isFs, size = 20 }: { isFs: boolean; size?: number }) {
  if (isFs) return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
    </svg>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
    </svg>
  );
}

export function WatchPlayer({
  resumeTime,
  sessionKey,
  title,
  streamUrl,
  posterUrl,
  episodeNumber,
  episodeTotal,
  magnetLink,
  torrentHash,
  fileIndex,
  subtitles,
  backendSubtitleOptions = [],
  backendAudioOptions = [],
  onExtractSubtitle,
  onDisableSubtitle,
  onExtractAudio,
  preferredSubtitleLabel,
  subtitleLoadingLabel,
  externalAudioTracks = [],
  selectedExternalAudioId = null,
  onSelectExternalAudio,
  audioLoadingLabel,
  audioLoadingMode,
  restrictForwardSeeksToBuffered = true,
}: WatchPlayerProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<HTMLVideoElement | null>(null);
  const subtitleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const assContainerRef = useRef<HTMLDivElement | null>(null);
  const externalAudioRef = useRef<HTMLAudioElement | null>(null);
  const hideTimer = useRef<number | null>(null);
  const seekToastTimerRef = useRef<number | null>(null);
  const restorePendingRef = useRef(false);
  const resumeAfterSeekRef = useRef(false);
  const seekingRef = useRef(false);
  const assRendererRef = useRef<AssRendererInstance | null>(null);
  const pgsRendererRef = useRef<PgsRendererInstance | null>(null);

  const hasResumePoint = Boolean(resumeTime && resumeTime > 5);
  const [restored, setRestored] = useState(false);
  const [resumeReady, setResumeReady] = useState(!hasResumePoint);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [seekToastVisible, setSeekToastVisible] = useState(false);
  const [isFs, setIsFs] = useState(false);
  const [subMenu, setSubMenu] = useState(false);
  const [audioMenu, setAudioMenu] = useState(false);
  const [textTracks, setTextTracks] = useState<PlayerTextTrackOption[]>([]);
  const [selectedSub, setSelectedSub] = useState<number | null>(null);
  const [selectedAssSubtitleId, setSelectedAssSubtitleId] = useState<number | null>(null);
  const [selectedBitmapSubtitleId, setSelectedBitmapSubtitleId] = useState<number | null>(null);
  const [audioTracks, setAudioTracks] = useState<AudioTrackOption[]>([]);
  const [selectedAudio, setSelectedAudio] = useState<number | null>(null);
  const [trackLoadingVisible, setTrackLoadingVisible] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(4);

  const effectiveTitle = title;
  const effectiveEpisodeNumber = episodeNumber;
  const effectiveEpisodeTotal = episodeTotal;
  const textSubtitleSources = useMemo(
    () => subtitles.filter((subtitle) => subtitle.format === undefined || subtitle.format === "text"),
    [subtitles],
  );
  const assSubtitleSources = useMemo(
    () => subtitles.filter((subtitle) => subtitle.format === "ass"),
    [subtitles],
  );
  const bitmapSubtitleSources = useMemo(
    () => subtitles.filter((subtitle) => subtitle.format === "pgs"),
    [subtitles],
  );
  const selectedAssSubtitle = useMemo(
    () => assSubtitleSources.find((subtitle) => subtitle.index === selectedAssSubtitleId) ?? null,
    [assSubtitleSources, selectedAssSubtitleId],
  );
  const selectedBitmapSubtitle = useMemo(
    () =>
      bitmapSubtitleSources.find((subtitle) => subtitle.index === selectedBitmapSubtitleId) ?? null,
    [bitmapSubtitleSources, selectedBitmapSubtitleId],
  );
  const selectedExternalAudioLabel =
    externalAudioTracks.find((track) => track.id === selectedExternalAudioId)?.label ?? null;
  const topBarTitle =
    effectiveEpisodeNumber != null
      ? `${effectiveTitle} • Episode ${effectiveEpisodeNumber}${effectiveEpisodeTotal != null ? `/${effectiveEpisodeTotal}` : ""}`
      : effectiveTitle;
  const subtitlesOff =
    selectedSub === null && selectedAssSubtitleId === null && selectedBitmapSubtitleId === null;
  const hasSelectedSubtitle =
    selectedSub !== null || selectedAssSubtitleId !== null || selectedBitmapSubtitleId !== null;

  useEffect(() => {
    sendClientDebug("watch-player", "mount", {
      sessionKey,
      torrentHash,
      fileIndex,
      streamUrl,
      subtitleCount: subtitles.length,
      externalAudioCount: externalAudioTracks.length,
    });
  }, [externalAudioTracks.length, fileIndex, sessionKey, streamUrl, subtitles.length, torrentHash]);

  useEffect(() => {
    return () => {
      if (seekToastTimerRef.current) {
        window.clearTimeout(seekToastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!sessionKey || !magnetLink) {
      return;
    }

    async function sendHeartbeat(progressSeconds: number, durationSeconds: number) {
      await fetch("/api/media-backend/watch-sessions/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionKey,
          magnetLink,
          fileIndex,
          torrentHash,
          title: effectiveTitle,
          posterUrl,
          episodeNumber: effectiveEpisodeNumber,
          episodeTotal: effectiveEpisodeTotal,
          progressSeconds,
          durationSeconds,
        }),
      }).catch(() => {});
    }

    void sendHeartbeat(currentTime, duration);

    const interval = window.setInterval(() => {
      const video = playerRef.current;
      if (!video) return;

      void sendHeartbeat(
        video.currentTime,
        Number.isFinite(video.duration) ? video.duration : duration,
      );
    }, 30_000);

    function deactivate() {
      const payload = JSON.stringify({
        sessionKey,
        magnetLink,
        fileIndex,
        torrentHash,
        title: effectiveTitle,
        posterUrl,
        episodeNumber: effectiveEpisodeNumber,
        episodeTotal: effectiveEpisodeTotal,
        progressSeconds: playerRef.current?.currentTime ?? currentTime,
        durationSeconds: Number.isFinite(playerRef.current?.duration) ? playerRef.current?.duration : duration,
      });

      navigator.sendBeacon(
        "/api/media-backend/watch-sessions/deactivate",
        new Blob([payload], { type: "application/json" }),
      );
    }

    window.addEventListener("pagehide", deactivate);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("pagehide", deactivate);
      deactivate();
    };
  }, [
    sessionKey,
    magnetLink,
    fileIndex,
    torrentHash,
    effectiveTitle,
    posterUrl,
    effectiveEpisodeNumber,
    effectiveEpisodeTotal,
  ]);

  const trackLoading = Boolean(subtitleLoadingLabel || audioLoadingLabel);

  useEffect(() => {
    let interval: number | null = null;
    let completeTimer: number | null = null;
    const startedAt = Date.now();
    const isAudioTranscode = audioLoadingMode === "transcode";
    const linearDurationMs = isAudioTranscode ? 60_000 : 20_000;
    const tailDurationMs = isAudioTranscode ? 22_000 : 9_000;

    if (trackLoading) {
      setTrackLoadingVisible(true);
      setLoadingProgress(4);

      interval = window.setInterval(() => {
        const elapsed = Date.now() - startedAt;
        const nextProgress =
          elapsed <= linearDurationMs
            ? 4 + (elapsed / linearDurationMs) * 84
            : 88 + (1 - Math.exp(-(elapsed - linearDurationMs) / tailDurationMs)) * 10;

        setLoadingProgress((current) => Math.max(current, Math.min(98, nextProgress)));
      }, 120);
    } else if (trackLoadingVisible) {
      setLoadingProgress(100);
      completeTimer = window.setTimeout(() => {
        setTrackLoadingVisible(false);
      }, 220);
    }

    return () => {
      if (interval) {
        window.clearInterval(interval);
      }
      if (completeTimer) {
        window.clearTimeout(completeTimer);
      }
    };
  }, [audioLoadingMode, trackLoading, trackLoadingVisible]);

  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    const video = p;

    function getTextTrackLabel(track: TextTrack, index: number) {
      return track.label || track.language || `${track.kind === "captions" ? "Captions" : "Subtitle"} ${index + 1}`;
    }

    function syncTextTracks() {
      const nextTextTracks = Array.from(video.textTracks)
        .filter((track) => track.kind === "subtitles" || track.kind === "captions")
        .map((track, index) => ({
          id: index,
          label: getTextTrackLabel(track, index),
          language: track.language || undefined,
          kind: track.kind,
      }));
      setTextTracks(nextTextTracks);
      logSubtitleDebug("sync-text-tracks", {
        availableTracks: nextTextTracks,
        browserTrackCount: video.textTracks.length,
      });

      const preferredIndex =
        preferredSubtitleLabel
          ? nextTextTracks.findIndex((track) => track.label === preferredSubtitleLabel)
          : -1;
      if (preferredIndex >= 0) {
        Array.from(video.textTracks).forEach((track, index) => {
          if (track.kind !== "subtitles" && track.kind !== "captions") return;
          track.mode = index === preferredIndex ? "showing" : "disabled";
        });
      }

      const showingIndex = preferredIndex >= 0
        ? preferredIndex
        : Array.from(video.textTracks).findIndex((track) => track.mode === "showing");
      setSelectedSub(showingIndex >= 0 ? showingIndex : null);
    }

    function syncAudioTracks() {
      const at = (video as HTMLVideoElementWithAudioTracks).audioTracks;
      if (!at) {
        setAudioTracks([]);
        setSelectedAudio(null);
        return;
      }

      const nextAudioTracks = Array.from(at).map((track, index) => ({
        id: index,
        label: track.label || track.language || `Track ${index + 1}`,
        language: track.language || undefined,
      }));
      const enabledIndex = Array.from(at).findIndex((track) => track.enabled);

      setAudioTracks(nextAudioTracks);
      setSelectedAudio(enabledIndex >= 0 ? enabledIndex : null);
    }

    function sync() {
      const externalAudio = externalAudioRef.current;
      setCurrentTime(video.currentTime);
      setDuration(Number.isFinite(video.duration) ? video.duration : 0);
      if (selectedExternalAudioId !== null && externalAudio) {
        setVolume(externalAudio.volume);
        setMuted(externalAudio.muted);
      } else {
        setVolume(video.volume);
        setMuted(video.muted);
      }
      const b = video.buffered;
      setBuffered(b.length ? b.end(b.length - 1) : 0);
    }

    function finishRestore() {
      if (!restorePendingRef.current && restored) {
        return;
      }

      restorePendingRef.current = false;
      const initialSubtitleIndex = Array.from(video.textTracks).findIndex((track) => track.mode === "showing");
      if (initialSubtitleIndex >= 0) {
        setSelectedSub(initialSubtitleIndex);
      }
      syncTextTracks();
      syncAudioTracks();
      setResumeReady(true);
      setRestored(true);
    }

    function onMeta() {
      logSubtitleDebug("video-loaded-metadata", {
        streamUrl,
        subtitlePropCount: textSubtitleSources.length,
      });
      sync();
      if (!restored && hasResumePoint && resumeTime) {
        const safe = Number.isFinite(video.duration) && video.duration > 0
          ? Math.min(resumeTime, video.duration - 3)
          : resumeTime;
        restorePendingRef.current = true;
        video.currentTime = safe;
        setCurrentTime(safe);
        return;
      }
      finishRestore();
    }

    function onPlay() {
      const externalAudio = externalAudioRef.current;
      if (selectedExternalAudioId !== null && externalAudio) {
        externalAudio.currentTime = video.currentTime;
        externalAudio.playbackRate = video.playbackRate;
        void safePlay(externalAudio, "video-play-sync-audio", {
          torrentHash,
          fileIndex,
        });
      }
      setPlaying(true);
    }
    function onPause() {
      const externalAudio = externalAudioRef.current;
      externalAudio?.pause();
      if (!p) return;
      setPlaying(false);
      setShowControls(true);
    }
    function onEnded() {
      const externalAudio = externalAudioRef.current;
      externalAudio?.pause();
      externalAudio?.removeAttribute("src");
      setPlaying(false);
      setShowControls(true);
    }
    function onVol() {
      const externalAudio = externalAudioRef.current;
      if (selectedExternalAudioId !== null && externalAudio) {
        setVolume(externalAudio.volume);
        setMuted(externalAudio.muted);
        return;
      }
      setVolume(video.volume);
      setMuted(video.muted);
    }
    function onProg() { const b = video.buffered; setBuffered(b.length ? b.end(b.length - 1) : 0); }
    function onTime() {
      sync();
      const externalAudio = externalAudioRef.current;
      if (!externalAudio || selectedExternalAudioId === null) {
        return;
      }
      if (Math.abs(externalAudio.currentTime - video.currentTime) > 0.35) {
        externalAudio.currentTime = video.currentTime;
      }
    }
    function onSeeked() {
      const externalAudio = externalAudioRef.current;
      seekingRef.current = false;
      const shouldResume = resumeAfterSeekRef.current;
      resumeAfterSeekRef.current = false;
      if (restorePendingRef.current) {
        sync();
        finishRestore();
      }

      if (shouldResume) {
        if (video.paused) {
          void safePlay(video, "seeked-resume-video", {
            torrentHash,
            fileIndex,
          });
        }
      }

      if (externalAudio && selectedExternalAudioId !== null) {
        externalAudio.currentTime = video.currentTime;
        if (!video.paused || shouldResume) {
          void safePlay(externalAudio, "seeked-resume-audio", {
            torrentHash,
            fileIndex,
            externalAudioId: selectedExternalAudioId,
          });
        }
      }
    }
    function onSeeking() {
      seekingRef.current = true;
      resumeAfterSeekRef.current = !video.paused;
      const externalAudio = externalAudioRef.current;
      externalAudio?.pause();
    }
    function onRateChange() {
      const externalAudio = externalAudioRef.current;
      if (!externalAudio || selectedExternalAudioId === null) {
        return;
      }
      externalAudio.playbackRate = video.playbackRate;
    }
    function onTextTrackListChange() { syncTextTracks(); }
    function onAudioTrackListChange() { syncAudioTracks(); }

    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("volumechange", onVol);
    video.addEventListener("progress", onProg);
    video.addEventListener("ended", onEnded);
    video.addEventListener("seeking", onSeeking);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("ratechange", onRateChange);
    video.textTracks.addEventListener("change", onTextTrackListChange);
    video.textTracks.addEventListener("addtrack", onTextTrackListChange as EventListener);
    video.textTracks.addEventListener("removetrack", onTextTrackListChange as EventListener);
    (video as HTMLVideoElementWithAudioTracks).audioTracks?.addEventListener("change", onAudioTrackListChange);
    (video as HTMLVideoElementWithAudioTracks).audioTracks?.addEventListener("addtrack", onAudioTrackListChange);
    (video as HTMLVideoElementWithAudioTracks).audioTracks?.addEventListener("removetrack", onAudioTrackListChange);

    return () => {
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("volumechange", onVol);
      video.removeEventListener("progress", onProg);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("seeking", onSeeking);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("ratechange", onRateChange);
      video.textTracks.removeEventListener("change", onTextTrackListChange);
      video.textTracks.removeEventListener("addtrack", onTextTrackListChange as EventListener);
      video.textTracks.removeEventListener("removetrack", onTextTrackListChange as EventListener);
      (video as HTMLVideoElementWithAudioTracks).audioTracks?.removeEventListener("change", onAudioTrackListChange);
      (video as HTMLVideoElementWithAudioTracks).audioTracks?.removeEventListener("addtrack", onAudioTrackListChange);
      (video as HTMLVideoElementWithAudioTracks).audioTracks?.removeEventListener("removetrack", onAudioTrackListChange);
    };
  }, [restored, resumeTime, textSubtitleSources, effectiveTitle, posterUrl, effectiveEpisodeNumber, effectiveEpisodeTotal, preferredSubtitleLabel, muted, selectedExternalAudioId, sessionKey, selectedExternalAudioLabel, streamUrl]);


  useEffect(() => {
    const video = playerRef.current;
    const audio = externalAudioRef.current;
    const selectedExternalAudio = externalAudioTracks.find((track) => track.id === selectedExternalAudioId);

    if (!video || !audio) {
      return;
    }

    if (!selectedExternalAudio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      video.muted = muted;
      video.volume = volume;
      return;
    }

    if (audio.src !== selectedExternalAudio.src) {
      audio.src = selectedExternalAudio.src;
      audio.currentTime = video.currentTime;
    }

    audio.muted = muted;
    audio.volume = volume;
    video.muted = true;

    if (!video.paused) {
      void safePlay(audio, "selected-external-audio-effect", {
        torrentHash,
        fileIndex,
        externalAudioId: selectedExternalAudio.id,
      });
    }
  }, [selectedExternalAudioId, externalAudioTracks, muted, volume]);

  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;

    Array.from(p.textTracks).forEach((track, index) => {
      if (track.kind !== "subtitles" && track.kind !== "captions") return;
      track.mode = index === selectedSub ? "showing" : "disabled";
    });
  }, [selectedSub, textTracks.length]);

  useEffect(() => {
    if (!preferredSubtitleLabel) {
      return;
    }

    const matchingBitmapSubtitle =
      bitmapSubtitleSources.find((subtitle) => subtitle.label === preferredSubtitleLabel) ?? null;

    if (!matchingBitmapSubtitle) {
      return;
    }

    const video = playerRef.current;
    if (video) {
      Array.from(video.textTracks).forEach((track) => {
        if (track.kind !== "subtitles" && track.kind !== "captions") return;
        track.mode = "disabled";
      });
    }

    setSelectedSub(null);
    setSelectedAssSubtitleId(null);
    setSelectedBitmapSubtitleId(matchingBitmapSubtitle.index);
  }, [bitmapSubtitleSources, preferredSubtitleLabel]);

  useEffect(() => {
    if (!preferredSubtitleLabel) {
      return;
    }

    const matchingAssSubtitle =
      assSubtitleSources.find((subtitle) => subtitle.label === preferredSubtitleLabel) ?? null;

    if (!matchingAssSubtitle) {
      return;
    }

    const video = playerRef.current;
    if (video) {
      Array.from(video.textTracks).forEach((track) => {
        if (track.kind !== "subtitles" && track.kind !== "captions") return;
        track.mode = "disabled";
      });
    }

    setSelectedSub(null);
    setSelectedBitmapSubtitleId(null);
    setSelectedAssSubtitleId(matchingAssSubtitle.index);
  }, [assSubtitleSources, preferredSubtitleLabel]);

  useEffect(() => {
    const video = playerRef.current;
    const assContainer = assContainerRef.current;

    assRendererRef.current?.destroy();
    assRendererRef.current = null;

    if (assContainer) {
      assContainer.replaceChildren();
    }

    if (!video || !assContainer || !selectedAssSubtitle) {
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    void Promise.all([
      loadUrl<{ default: JassubCtor }>("/jassub/jassub.bundle.js"),
      fetch(selectedAssSubtitle.src, {
        cache: "no-store",
        signal: controller.signal,
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load ASS subtitle: ${response.status}`);
        }

        return response.text();
      }),
    ])
      .then(([{ default: JASSUB }, subtitleContent]) => {
        if (cancelled) {
          return;
        }

        console.info("[shinobi:player] ass subtitle fetched", {
          subtitle: selectedAssSubtitle.label,
          src: selectedAssSubtitle.src,
          length: subtitleContent.length,
          preview: subtitleContent.slice(0, 120),
        });
        console.info("[shinobi:player] ass dialogue timing sample", {
          subtitle: selectedAssSubtitle.label,
          currentTime: video.currentTime,
          ...getAssDialogueSamples(subtitleContent, video.currentTime),
        });

        const canvas = document.createElement("canvas");
        canvas.style.position = "absolute";
        canvas.style.top = "50%";
        canvas.style.left = "50%";
        canvas.style.transform = "translate(-50%, -50%)";
        assContainer.appendChild(canvas);
        const renderer = new JASSUB({
          video,
          canvas,
          subContent: subtitleContent,
          workerUrl: "/jassub/worker/worker.bundle.js",
          wasmUrl: "/jassub/wasm/jassub-worker.wasm",
          modernWasmUrl: "/jassub/wasm/jassub-worker-modern.wasm",
          resampling: "script_height",
        });
        assRendererRef.current = renderer;

        console.info("[shinobi:player] ass subtitle renderer created", {
          subtitle: selectedAssSubtitle.label,
          src: selectedAssSubtitle.src,
          selectedAssSubtitleId,
          videoPaused: video.paused,
          currentTime: video.currentTime,
          containerChildren: assContainer.childElementCount,
        });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        console.warn("[shinobi:player] ass subtitle init failed", {
          subtitle: selectedAssSubtitle.label,
          src: selectedAssSubtitle.src,
          error: error instanceof Error ? error.message : String(error),
        });
      });

    return () => {
      cancelled = true;
      controller.abort();
      assRendererRef.current?.destroy();
      assRendererRef.current = null;
      assContainer.replaceChildren();
    };
  }, [selectedAssSubtitle, selectedAssSubtitleId]);


  useEffect(() => {
    const video = playerRef.current;
    const canvas = subtitleCanvasRef.current;

    pgsRendererRef.current?.dispose();
    pgsRendererRef.current = null;

    if (!video || !canvas || !selectedBitmapSubtitle) {
      return;
    }

    let cancelled = false;

    void loadUrl<{ PgsRenderer: PgsRendererCtor }>("/libpgs.bundle.js").then(({ PgsRenderer }) => {
      if (cancelled) {
        return;
      }

      pgsRendererRef.current?.dispose();
      pgsRendererRef.current = new PgsRenderer({
        video,
        canvas,
        subUrl: selectedBitmapSubtitle.src,
        workerUrl: "/libpgs.worker.js",
        aspectRatio: "contain",
        mode: "mainThread",
      });
    });

    return () => {
      cancelled = true;
      pgsRendererRef.current?.dispose();
      pgsRendererRef.current = null;
    };
  }, [selectedBitmapSubtitle]);

  useEffect(() => {
    const video = playerRef.current;
    const canvas = subtitleCanvasRef.current;

    if (!video || !canvas || selectedBitmapSubtitleId === null) {
      return;
    }

    const syncCanvasSize = () => {
      const width = Math.max(1, Math.round(video.clientWidth * window.devicePixelRatio));
      const height = Math.max(1, Math.round(video.clientHeight * window.devicePixelRatio));

      if (canvas.width !== width) {
        canvas.width = width;
      }
      if (canvas.height !== height) {
        canvas.height = height;
      }
    };

    syncCanvasSize();

    const resizeObserver = new ResizeObserver(() => {
      syncCanvasSize();
    });

    resizeObserver.observe(video);
    window.addEventListener("resize", syncCanvasSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", syncCanvasSize);
    };
  }, [selectedBitmapSubtitleId]);

  useEffect(() => {
    const video = playerRef.current;
    if (!video || selectedBitmapSubtitleId === null) {
      return;
    }

    let frameId = 0;
    let cancelled = false;

    const renderFrame = () => {
      if (cancelled) {
        return;
      }

      if (pgsRendererRef.current) {
        pgsRendererRef.current.renderAtTimestamp(video.currentTime);
      }

      frameId = window.requestAnimationFrame(renderFrame);
    };

    frameId = window.requestAnimationFrame(renderFrame);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
    };
  }, [selectedBitmapSubtitleId]);

  useEffect(() => {
    const handler = () => setIsFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  function scheduleHide() {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (playerRef.current && !playerRef.current.paused) setShowControls(false);
    }, 2500);
  }

  function reveal() { setShowControls(true); scheduleHide(); }

  function showSeekToast() {
    setSeekToastVisible(true);
    if (seekToastTimerRef.current) {
      window.clearTimeout(seekToastTimerRef.current);
    }
    seekToastTimerRef.current = window.setTimeout(() => {
      setSeekToastVisible(false);
      seekToastTimerRef.current = null;
    }, 1800);
  }

  function getBufferedSeekLimit(video: HTMLVideoElement): number {
    const { buffered: ranges, currentTime: now } = video;
    const tolerance = 0.35;

    if (!ranges.length) {
      return now;
    }

    for (let index = 0; index < ranges.length; index += 1) {
      const start = ranges.start(index);
      const end = ranges.end(index);

      if (now >= start - tolerance && now <= end + tolerance) {
        return Math.max(now, end - SEEK_BUFFER_MARGIN_SECONDS);
      }
    }

    return now;
  }

  function togglePlay() {
    if (!resumeReady || trackLoading) return;
    const p = playerRef.current;
    const externalAudio = externalAudioRef.current;
    if (!p) return;
    if (p.paused) {
      void safePlay(p, "toggle-play-video", {
        torrentHash,
        fileIndex,
      });
      if (selectedExternalAudioId !== null && externalAudio) {
        externalAudio.currentTime = p.currentTime;
        void safePlay(externalAudio, "toggle-play-audio", {
          torrentHash,
          fileIndex,
          externalAudioId: selectedExternalAudioId,
        });
      }
      scheduleHide();
    } else {
      p.pause();
      externalAudio?.pause();
    }
  }

  function seek(t: number) {
    if (!resumeReady || trackLoading) return;
    const p = playerRef.current;
    const externalAudio = externalAudioRef.current;
    if (!p) return;
    const maxTime = duration || p.duration || 0;
    const targetTime = Math.max(0, Math.min(t, maxTime));
    const bufferedSeekLimit = Math.min(maxTime, getBufferedSeekLimit(p));
    const limitedTime =
      restrictForwardSeeksToBuffered &&
      targetTime > p.currentTime &&
      targetTime > bufferedSeekLimit
        ? Math.max(p.currentTime, bufferedSeekLimit)
        : targetTime;

    if (limitedTime !== targetTime) {
      showSeekToast();
    }

    resumeAfterSeekRef.current = !p.paused;
    p.currentTime = limitedTime;
    if (selectedExternalAudioId !== null && externalAudio) {
      externalAudio.currentTime = limitedTime;
    }
    setCurrentTime(limitedTime);
  }

  function seekBy(d: number) {
    if (!resumeReady || trackLoading) return;
    const p = playerRef.current;
    if (!p) return;
    seek(Math.max(0, Math.min(p.currentTime + d, duration || p.duration || 0)));
  }

  function setVol(v: number) {
    if (!resumeReady || trackLoading) return;
    const p = playerRef.current;
    const externalAudio = externalAudioRef.current;
    if (!p) return;
    p.volume = v;
    if (externalAudio) {
      externalAudio.volume = v;
      externalAudio.muted = v === 0;
    }
    if (selectedExternalAudioId === null) {
      p.muted = v === 0;
      setMuted(p.muted);
    } else {
      p.muted = true;
      setMuted(v === 0);
    }
    setVolume(v);
  }

  function toggleMute() {
    if (!resumeReady || trackLoading) return;
    const p = playerRef.current;
    const externalAudio = externalAudioRef.current;
    if (!p) return;
    if (selectedExternalAudioId !== null && externalAudio) {
      const nextMuted = !externalAudio.muted;
      externalAudio.muted = nextMuted;
      p.muted = true;
      setMuted(nextMuted);
      return;
    }
    p.muted = !p.muted;
    if (externalAudio) {
      externalAudio.muted = p.muted;
    }
    setMuted(p.muted);
  }

  async function toggleFs() {
    if (!resumeReady || trackLoading) return;
    const c = containerRef.current;
    if (!c) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await c.requestFullscreen();
  }

  const onKeyboardShortcut = useEffectEvent((event: KeyboardEvent) => {
    if (event.defaultPrevented || !isKeyboardShortcutTarget(event.target)) {
      return;
    }

    if ((event.key === " " || event.code === "Space") && !event.repeat) {
      event.preventDefault();
      togglePlay();
      reveal();
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      seekBy(-KEYBOARD_SEEK_SECONDS);
      reveal();
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      seekBy(KEYBOARD_SEEK_SECONDS);
      reveal();
      return;
    }

    if (event.key === "m" || event.key === "M") {
      event.preventDefault();
      toggleMute();
      reveal();
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", onKeyboardShortcut);
    return () => window.removeEventListener("keydown", onKeyboardShortcut);
  }, []);

  function selectSub(idx: number | null) {
    if (!resumeReady || trackLoading) return;
    const p = playerRef.current;
    if (!p) return;
    if (idx === null) {
      onDisableSubtitle?.();
    }
    Array.from(p.textTracks).forEach((track, index) => {
      if (track.kind !== "subtitles" && track.kind !== "captions") return;
      track.mode = index === idx ? "showing" : "disabled";
    });
    logSubtitleDebug("select-subtitle", {
      requestedIndex: idx,
      trackModes: Array.from(p.textTracks).map((track, index) => ({
        index,
        label: track.label,
        language: track.language,
        mode: track.mode,
        kind: track.kind,
      })),
    });
    setSelectedAssSubtitleId(null);
    setSelectedBitmapSubtitleId(null);
    setSelectedSub(idx);
    setSubMenu(false);
  }

  function selectAssSubtitle(id: number) {
    if (!resumeReady || trackLoading) return;
    const p = playerRef.current;
    if (!p) return;
    const selectedTrack = assSubtitleSources.find((track) => track.index === id) ?? null;
    Array.from(p.textTracks).forEach((track) => {
      if (track.kind !== "subtitles" && track.kind !== "captions") return;
      track.mode = "disabled";
    });
    console.info("[shinobi:player] ass subtitle selected", {
      id,
      label: selectedTrack?.label,
      src: selectedTrack?.src,
      currentTime: p.currentTime,
    });
    setSelectedSub(null);
    setSelectedBitmapSubtitleId(null);
    setSelectedAssSubtitleId(id);
    setSubMenu(false);
  }

  function selectBitmapSubtitle(id: number) {
    if (!resumeReady || trackLoading) return;
    const p = playerRef.current;
    if (!p) return;
    Array.from(p.textTracks).forEach((track) => {
      if (track.kind !== "subtitles" && track.kind !== "captions") return;
      track.mode = "disabled";
    });
    setSelectedSub(null);
    setSelectedAssSubtitleId(null);
    setSelectedBitmapSubtitleId(id);
    setSubMenu(false);
  }

  function selectAudio(id: number) {
    if (!resumeReady || trackLoading) return;
    const p = playerRef.current as HTMLVideoElementWithAudioTracks | null;
    const tracks = p?.audioTracks;
    if (!tracks) return;
    Array.from(tracks).forEach((t, i) => { t.enabled = i === id; });
    const externalAudio = externalAudioRef.current;
    if (externalAudio) {
      externalAudio.pause();
      externalAudio.removeAttribute("src");
      externalAudio.load();
    }
    if (p) {
      p.muted = muted;
      p.volume = volume;
    }
    onSelectExternalAudio?.(null);
    setSelectedAudio(id);
    setAudioMenu(false);
  }

  function selectOriginalAudio() {
    if (!resumeReady || trackLoading) return;

    const video = playerRef.current as HTMLVideoElementWithAudioTracks | null;
    const audio = externalAudioRef.current;

    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }

    if (video) {
      video.muted = muted;
      video.volume = volume;
    }

    onSelectExternalAudio?.(null);
    setAudioMenu(false);
  }

  async function selectExternalAudio(id: number) {
    if (!resumeReady || trackLoading) return;
    const video = playerRef.current;
    const audio = externalAudioRef.current;
    const selectedTrack = externalAudioTracks.find((track) => track.id === id);
    if (!video || !audio || !selectedTrack) return;

    onSelectExternalAudio?.(id);
    setSelectedAudio(null);
    setAudioMenu(false);

    try {
      audio.pause();
      audio.src = selectedTrack.src;
      audio.load();
      await waitForAudioReady(audio);
      audio.currentTime = video.currentTime;
      audio.playbackRate = video.playbackRate;
      audio.volume = volume;
      audio.muted = muted;
      video.muted = true;

      if (!video.paused) {
        await safePlay(audio, "select-external-audio", {
          torrentHash,
          fileIndex,
          externalAudioId: id,
        });
      }
    } catch {
      onSelectExternalAudio?.(null);
      if (video) {
        video.muted = muted;
        video.volume = volume;
      }
    }
  }

  const playedPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;
  const volPct = muted ? 0 : volume;
  const hasSubtitleOptions =
    textSubtitleSources.length > 0 ||
    assSubtitleSources.length > 0 ||
    bitmapSubtitleSources.length > 0 ||
    textTracks.length > 0 ||
    backendSubtitleOptions.length > 0;
  const hasAudioOptions =
    audioTracks.length > 0 || externalAudioTracks.length > 0 || backendAudioOptions.length > 0;
  const hasDerivedAudioOptions = externalAudioTracks.length > 0 || backendAudioOptions.length > 0;

  const btnCls = "flex items-center justify-center rounded p-1.5 text-white/80 transition-colors hover:text-white hover:bg-white/10";
  const trackLoadingMessage =
    audioLoadingMode === "transcode"
      ? "Transcoding audio to a browser-safe format. This can take up to about a minute."
      : audioLoadingLabel
        ? `Preparing audio track${audioLoadingLabel ? `: ${audioLoadingLabel}` : ""}`
        : subtitleLoadingLabel
          ? `Preparing subtitle track${subtitleLoadingLabel ? `: ${subtitleLoadingLabel}` : ""}`
          : "Preparing track";

  return (
    <div
      ref={containerRef}
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "#000", overflow: "hidden" }}
      onMouseMove={reveal}
      onMouseLeave={() => { if (playing && !trackLoadingVisible) setShowControls(false); }}
    >
      <video
        ref={playerRef}
        className="shinobi-player"
        preload="auto"
        style={{ width: "100%", height: "100%", display: "block", objectFit: "contain", background: "#000", visibility: resumeReady ? "visible" : "hidden" }}
        src={streamUrl}
        onClick={togglePlay}
        controls={false}
      >
        {textSubtitleSources.map((s) => (
          <track
            key={s.index}
            kind="subtitles"
            src={s.src}
            label={s.label}
            srcLang={s.language ?? "und"}
            default={false}
          />
        ))}
      </video>
      <div
        ref={assContainerRef}
        aria-hidden="true"
        className="shinobi-ass-overlay"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 8,
          overflow: "hidden",
          display: selectedAssSubtitleId !== null ? "block" : "none",
        }}
      />
      <canvas
        ref={subtitleCanvasRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          objectFit: "contain",
          zIndex: 8,
          display: selectedBitmapSubtitleId !== null ? "block" : "none",
        }}
      />
      <audio ref={externalAudioRef} preload="metadata" style={{ display: "none" }} />

      {!resumeReady ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/18 border-t-white" />
        </div>
      ) : null}

      <div
        aria-live="polite"
        className="pointer-events-none absolute left-1/2 top-5 z-20 -translate-x-1/2 rounded-full border border-white/12 bg-black/82 px-4 py-2 text-sm font-medium text-white shadow-[0_18px_48px_rgba(0,0,0,0.38)] transition-all duration-200"
        style={{
          opacity: seekToastVisible ? 1 : 0,
          transform: `translateX(-50%) translateY(${seekToastVisible ? "0" : "-10px"})`,
        }}
      >
        That part is not ready yet.
      </div>

      {/* gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

      {/* controls */}
      <div
        className="absolute inset-0 flex flex-col justify-between transition-opacity duration-200"
        style={{ opacity: showControls && resumeReady && !trackLoadingVisible ? 1 : 0, pointerEvents: showControls && resumeReady && !trackLoadingVisible ? "auto" : "none" }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            togglePlay();
          }
        }}
      >
        {/* top bar: back + title */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px" }}>
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Back"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)", border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", color: "#fff", flexShrink: 0 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15,18 9,12 15,6" />
            </svg>
          </button>
          <p style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.9)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{topBarTitle}</p>
        </div>

        {/* bottom controls wrapper */}
        <div>

        {/* seekbar */}
        <div className="seekbar-wrap px-4 py-1">
          <div className="relative h-1 rounded-full bg-white/20 cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              seek(((e.clientX - rect.left) / rect.width) * (duration || 0));
            }}
          >
            <div className="absolute inset-y-0 left-0 rounded-full bg-white/30" style={{ width: `${bufferedPct}%` }} />
            <div className="absolute inset-y-0 left-0 rounded-full bg-white" style={{ width: `${playedPct}%` }} />
          </div>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.5}
            value={currentTime}
            onChange={(e) => seek(Number(e.target.value))}
            className="mt-[-4px] h-1"
            style={{ marginTop: "-14px", opacity: 0, position: "relative", zIndex: 2 }}
          />
        </div>

        {/* bottom controls */}
        <div className="flex items-center gap-1 px-3 pb-3">
          {/* play/pause */}
          <button type="button" onClick={togglePlay} className={btnCls} aria-label={playing ? "Pause" : "Play"}>
            {playing ? <IconPause size={22} /> : <IconPlay size={22} />}
          </button>

          {/* rewind */}
          <button type="button" onClick={() => seekBy(-10)} className={btnCls} aria-label="Rewind 10s">
            <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.5 3C8.36 3 4.86 5.68 3.58 9.4L5.5 10c1-2.8 3.68-4.8 7-4.8 4.04 0 7.32 3.28 7.32 7.32s-3.28 7.32-7.32 7.32c-2.2 0-4.15-.97-5.5-2.5L8.5 16H4v4.5l1.62-1.62C7.32 20.56 9.8 21.64 12.5 21.64c4.97 0 9-4.03 9-9s-4.03-9-9-9z"/>
              <text x="12.5" y="14" fontSize="5.5" textAnchor="middle" fill="currentColor" fontFamily="sans-serif">10</text>
            </svg>
          </button>

          {/* forward */}
          <button type="button" onClick={() => seekBy(10)} className={btnCls} aria-label="Forward 10s">
            <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.5 3c4.14 0 7.64 2.68 8.92 6.4L18.5 10c-1-2.8-3.68-4.8-7-4.8-4.04 0-7.32 3.28-7.32 7.32s3.28 7.32 7.32 7.32c2.2 0 4.15-.97 5.5-2.5L15.5 16H20v4.5l-1.62-1.62C16.68 20.56 14.2 21.64 11.5 21.64c-4.97 0-9-4.03-9-9s4.03-9 9-9z"/>
              <text x="11.5" y="14" fontSize="5.5" textAnchor="middle" fill="currentColor" fontFamily="sans-serif">10</text>
            </svg>
          </button>

          {/* volume */}
          <button type="button" onClick={toggleMute} className={btnCls} aria-label="Toggle mute">
            <IconVolume muted={muted || volume === 0} size={20} />
          </button>

          {/* volume slider */}
          <div className="volbar-wrap flex items-center" style={{ width: 80 }}>
            <div className="relative h-1 w-full rounded-full bg-white/20">
              <div className="absolute inset-y-0 left-0 rounded-full bg-white" style={{ width: `${volPct * 100}%` }} />
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={volPct}
              onChange={(e) => setVol(Number(e.target.value))}
              style={{ position: "absolute", width: 80, opacity: 0, cursor: "pointer" }}
            />
          </div>

          {/* time */}
          <span className="ml-2 flex-1 text-xs text-white/60 tabular-nums">
            {fmt(currentTime)} / {fmt(duration)}
          </span>

          {/* subs */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setSubMenu(v => !v); setAudioMenu(false); }}
              className={`${btnCls} ${hasSelectedSubtitle ? "text-white" : ""} ${!hasSubtitleOptions ? "opacity-60" : ""}`}
              aria-label="Subtitles"
              title="Subtitles"
            >
              <IconCC size={20} />
            </button>
            {subMenu && (
              <div className="absolute bottom-10 right-0 z-20 min-w-[220px] rounded-lg border border-white/10 bg-[#1a1a1a] py-1 shadow-xl">
                <div className="h-[min(18rem,calc(100vh-10rem))] overflow-y-auto overscroll-contain" style={{ scrollbarWidth: "none" }}>
                  {textTracks.length > 0 ? (
                    <>
                      <button
                        type="button"
                        onClick={() => selectSub(null)}
                        className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-white/8 ${subtitlesOff ? "bg-white/10 font-medium text-white" : "text-[var(--muted)]"}`}
                      >
                        Off
                      </button>
                      {textTracks.map(track => (
                        <button
                          key={track.id}
                          type="button"
                          onClick={() => selectSub(track.id)}
                          className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-white/8 ${selectedSub === track.id ? "bg-white/10 font-medium text-white" : "text-[var(--muted)]"}`}
                        >
                          {track.label}
                        </button>
                      ))}
                      {backendSubtitleOptions.length > 0 ? (
                        <>
                          <div className="mx-3 my-2 h-px bg-white/10" />
                          {backendSubtitleOptions.map((track) => (
                            <button
                              key={track.id}
                              type="button"
                              onClick={() => {
                                setSubMenu(false);
                                onExtractSubtitle?.(track.id);
                              }}
                              disabled={track.state === "running"}
                              className={`flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm transition-colors hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-50 ${
                                preferredSubtitleLabel === track.label || subtitleLoadingLabel === track.label
                                  ? "bg-white/10 font-medium text-white"
                                  : "text-[var(--muted)]"
                              }`}
                            >
                              <span className="min-w-0 truncate">{track.label}</span>
                            </button>
                          ))}
                        </>
                      ) : null}
                      {bitmapSubtitleSources.length > 0 ? (
                        <>
                          <div className="mx-3 my-2 h-px bg-white/10" />
                          {bitmapSubtitleSources.map((track) => (
                            <button
                              key={track.index}
                              type="button"
                              onClick={() => selectBitmapSubtitle(track.index)}
                              className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-white/8 ${
                                selectedBitmapSubtitleId === track.index
                                  ? "bg-white/10 font-medium text-white"
                                  : "text-[var(--muted)]"
                              }`}
                            >
                              {track.label}
                            </button>
                          ))}
                        </>
                      ) : null}
                      {assSubtitleSources.length > 0 ? (
                        <>
                          <div className="mx-3 my-2 h-px bg-white/10" />
                          {assSubtitleSources.map((track) => (
                            <button
                              key={track.index}
                              type="button"
                              onClick={() => selectAssSubtitle(track.index)}
                              className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-white/8 ${
                                selectedAssSubtitleId === track.index
                                  ? "bg-white/10 font-medium text-white"
                                  : "text-[var(--muted)]"
                              }`}
                            >
                              {track.label}
                            </button>
                          ))}
                        </>
                      ) : null}
                    </>
                  ) : (
                    <>
                      {backendSubtitleOptions.length > 0 || bitmapSubtitleSources.length > 0 || assSubtitleSources.length > 0 ? (
                        <>
                          <button
                            type="button"
                            onClick={() => selectSub(null)}
                            className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-white/8 ${subtitlesOff ? "bg-white/10 font-medium text-white" : "text-[var(--muted)]"}`}
                          >
                            Off
                          </button>
                          {backendSubtitleOptions.map((track) => (
                            <button
                              key={track.id}
                              type="button"
                              onClick={() => {
                                setSubMenu(false);
                                onExtractSubtitle?.(track.id);
                              }}
                              disabled={track.state === "running"}
                              className={`flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm transition-colors hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-50 ${
                                preferredSubtitleLabel === track.label || subtitleLoadingLabel === track.label
                                  ? "bg-white/10 font-medium text-white"
                                  : "text-[var(--muted)]"
                              }`}
                            >
                              <span className="min-w-0 truncate">{track.label}</span>
                            </button>
                          ))}
                          {bitmapSubtitleSources.map((track) => (
                            <button
                              key={track.index}
                              type="button"
                              onClick={() => selectBitmapSubtitle(track.index)}
                              className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-white/8 ${
                                selectedBitmapSubtitleId === track.index
                                  ? "bg-white/10 font-medium text-white"
                                  : "text-[var(--muted)]"
                              }`}
                            >
                              {track.label}
                            </button>
                          ))}
                          {assSubtitleSources.map((track) => (
                            <button
                              key={track.index}
                              type="button"
                              onClick={() => selectAssSubtitle(track.index)}
                              className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-white/8 ${
                                selectedAssSubtitleId === track.index
                                  ? "bg-white/10 font-medium text-white"
                                  : "text-[var(--muted)]"
                              }`}
                            >
                              {track.label}
                            </button>
                          ))}
                        </>
                      ) : (
                        <p className="px-4 py-3 text-sm text-[var(--muted)]">
                          No subtitle tracks detected for this video.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* audio tracks */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setAudioMenu(v => !v); setSubMenu(false); }}
              className={`${btnCls} ${selectedAudio !== null || selectedExternalAudioId !== null ? "text-white" : ""} ${!hasAudioOptions ? "opacity-60" : ""}`}
              aria-label="Audio tracks"
              title="Audio tracks"
            >
              <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </button>
            {audioMenu && (
              <div className="absolute bottom-10 right-0 z-20 min-w-[220px] rounded-lg border border-white/10 bg-[#1a1a1a] py-1 shadow-xl">
                <div className="h-[min(18rem,calc(100vh-10rem))] overflow-y-auto overscroll-contain" style={{ scrollbarWidth: "none" }}>
                  <button
                    type="button"
                    onClick={selectOriginalAudio}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-white/8 ${selectedExternalAudioId === null && selectedAudio === null ? "bg-white/10 font-medium text-white" : "text-[var(--muted)]"}`}
                  >
                    Original audio
                  </button>
                  {audioTracks.length > 0 ? (
                    <>
                      <div className="mx-3 my-2 h-px bg-white/10" />
                      {audioTracks.map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => selectAudio(t.id)}
                          className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-white/8 ${selectedAudio === t.id && selectedExternalAudioId === null ? "bg-white/10 font-medium text-white" : "text-[var(--muted)]"}`}
                        >
                          {t.label}
                        </button>
                      ))}
                      {externalAudioTracks.length > 0 ? (
                        <>
                          <div className="mx-3 my-2 h-px bg-white/10" />
                          {externalAudioTracks.map((track) => (
                            <button
                              key={track.id}
                              type="button"
                              onClick={() => selectExternalAudio(track.id)}
                              className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-white/8 ${selectedExternalAudioId === track.id ? "bg-white/10 font-medium text-white" : "text-[var(--muted)]"}`}
                            >
                              {track.label}
                            </button>
                          ))}
                        </>
                      ) : null}
                      {backendAudioOptions.length > 0 ? (
                        <>
                          <div className="mx-3 my-2 h-px bg-white/10" />
                          <p className="px-4 pb-1 text-[10px] uppercase tracking-[0.2em] text-white/35">
                            Extract from source
                          </p>
                          {backendAudioOptions.map((track) => (
                            <button
                              key={track.id}
                              type="button"
                              onClick={() => onExtractAudio?.(track.id)}
                              disabled={track.state === "running"}
                              className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm transition-colors hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <span className="min-w-0 truncate text-[var(--muted)]">{track.label}</span>
                            </button>
                          ))}
                        </>
                      ) : null}
                    </>
                  ) : (
                    <>
                      {hasDerivedAudioOptions ? (
                        <>
                          {externalAudioTracks.length > 0 ? (
                            externalAudioTracks.map((track) => (
                              <button
                                key={track.id}
                                type="button"
                                onClick={() => selectExternalAudio(track.id)}
                                className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-white/8 ${selectedExternalAudioId === track.id ? "bg-white/10 font-medium text-white" : "text-[var(--muted)]"}`}
                              >
                                {track.label}
                              </button>
                            ))
                          ) : null}
                          {backendAudioOptions.map((track) => (
                            <button
                              key={track.id}
                              type="button"
                              onClick={() => {
                                setAudioMenu(false);
                                onExtractAudio?.(track.id);
                              }}
                              disabled={track.state === "running"}
                              className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm transition-colors hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <span className="min-w-0 truncate text-[var(--muted)]">{track.label}</span>
                            </button>
                          ))}
                        </>
                      ) : (
                        <p className="px-4 py-3 text-sm text-[var(--muted)]">
                          No selectable audio tracks were exposed by this browser for the current video.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* fullscreen */}
          <button type="button" onClick={toggleFs} className={btnCls} aria-label="Toggle fullscreen">
            <IconFullscreen isFs={isFs} size={20} />
          </button>
        </div>
        </div>
      </div>

      {/* center play/pause on click */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity: resumeReady && showControls && !playing && !trackLoading ? 1 : 0, transition: "opacity 0.2s" }}
      >
        <div className="rounded-full bg-black/50 p-5 text-white">
          <IconPlay size={36} />
        </div>
      </div>

      {!resumeReady ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/18 border-t-white" />
        </div>
      ) : null}

      {trackLoadingVisible ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="w-[min(420px,calc(100vw-56px))]">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/12">
              <div
                style={{ width: `${loadingProgress}%`, transition: "width 0.18s linear" }}
                className="h-full rounded-full bg-white"
              />
            </div>
            <p className="mt-3 text-center text-sm text-white/60">
              {trackLoadingMessage}
            </p>
          </div>
        </div>
      ) : null}

      <style jsx global>{`
        .shinobi-ass-overlay,
        .shinobi-ass-overlay * {
          font-family: "Trebuchet MS", Trebuchet, Arial, sans-serif !important;
        }

        .shinobi-ass-overlay span,
        .shinobi-ass-overlay div {
          -webkit-text-stroke: 0.45px rgba(0, 0, 0, 0.72) !important;
          paint-order: stroke fill !important;
          text-shadow:
            0 1px 2px rgba(0, 0, 0, 0.72),
            0 2px 6px rgba(0, 0, 0, 0.38) !important;
        }
      `}</style>
    </div>
  );
}
