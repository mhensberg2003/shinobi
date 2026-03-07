"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type SubtitleTrack = { index: number; label: string; src: string; language?: string; default?: boolean };
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
  storageKey: string;
  title: string;
  streamUrl: string;
  posterUrl?: string;
  episodeNumber?: number;
  episodeTotal?: number;
  subtitles: SubtitleTrack[];
  backendSubtitleOptions?: BackendTrackOption[];
  backendAudioOptions?: BackendTrackOption[];
  onExtractSubtitle?: (id: number) => void;
  onExtractAudio?: (id: number) => void;
  preferredSubtitleLabel?: string | null;
  subtitleLoadingLabel?: string | null;
  externalAudioTracks?: Array<{ id: number; label: string; src: string; language?: string }>;
  selectedExternalAudioId?: number | null;
  onSelectExternalAudio?: (id: number | null) => void;
  audioLoadingLabel?: string | null;
};

type StoredProgress = { title: string; currentTime: number; duration: number; updatedAt: string; posterUrl?: string; episodeNumber?: number; episodeTotal?: number };

type HTMLVideoElementWithAudioTracks = HTMLVideoElement & {
  audioTracks?: ArrayLike<{ enabled: boolean; label?: string; language?: string }> & EventTarget;
};
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

function readProgress(key: string): StoredProgress | null {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; } catch { return null; }
}

function looksLikeTorrentTitle(value?: string | null): boolean {
  if (!value) return false;

  const trimmed = value.trim();
  if (!trimmed) return false;

  return (
    /\.[a-z0-9]{2,4}$/i.test(trimmed) ||
    /(?:bluray|brrip|webrip|web-dl|hdtv|x264|x265|hevc|aac|10bit|2160p|1080p|720p)/i.test(trimmed) ||
    (trimmed.includes(".") && !trimmed.includes(" "))
  );
}

function resolvePreferredTitle(currentTitle: string, savedTitle?: string): string {
  if (!savedTitle) {
    return currentTitle;
  }

  if (!currentTitle) {
    return savedTitle;
  }

  if (looksLikeTorrentTitle(currentTitle) && !looksLikeTorrentTitle(savedTitle)) {
    return savedTitle;
  }

  return currentTitle;
}

function writeProgress(key: string, p: StoredProgress) {
  try {
    const existing = readProgress(key);
    const resolvedTitle = resolvePreferredTitle(p.title, existing?.title);
    const next: StoredProgress = {
      ...existing,
      ...p,
      title: resolvedTitle || existing?.title || "Untitled",
      posterUrl: p.posterUrl || existing?.posterUrl,
      episodeNumber: p.episodeNumber ?? existing?.episodeNumber,
      episodeTotal: p.episodeTotal ?? existing?.episodeTotal,
    };

    localStorage.setItem(key, JSON.stringify(next));
  } catch {}
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
  storageKey,
  title,
  streamUrl,
  posterUrl,
  episodeNumber,
  episodeTotal,
  subtitles,
  backendSubtitleOptions = [],
  backendAudioOptions = [],
  onExtractSubtitle,
  onExtractAudio,
  preferredSubtitleLabel,
  subtitleLoadingLabel,
  externalAudioTracks = [],
  selectedExternalAudioId = null,
  onSelectExternalAudio,
  audioLoadingLabel,
}: WatchPlayerProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<HTMLVideoElement | null>(null);
  const externalAudioRef = useRef<HTMLAudioElement | null>(null);
  const hideTimer = useRef<number | null>(null);

  const [saved] = useState(() => readProgress(storageKey));
  const [restored, setRestored] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFs, setIsFs] = useState(false);
  const [subMenu, setSubMenu] = useState(false);
  const [audioMenu, setAudioMenu] = useState(false);
  const [textTracks, setTextTracks] = useState<PlayerTextTrackOption[]>([]);
  const [selectedSub, setSelectedSub] = useState<number | null>(null);
  const [audioTracks, setAudioTracks] = useState<AudioTrackOption[]>([]);
  const [selectedAudio, setSelectedAudio] = useState<number | null>(null);
  const effectiveTitle = resolvePreferredTitle(title, saved?.title);
  const effectiveEpisodeNumber = episodeNumber ?? saved?.episodeNumber;
  const effectiveEpisodeTotal = episodeTotal ?? saved?.episodeTotal;
  const topBarTitle =
    effectiveEpisodeNumber != null
      ? `${effectiveTitle} • Episode ${effectiveEpisodeNumber}${effectiveEpisodeTotal != null ? `/${effectiveEpisodeTotal}` : ""}`
      : effectiveTitle;

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

    function onMeta() {
      logSubtitleDebug("video-loaded-metadata", {
        streamUrl,
        subtitlePropCount: subtitles.length,
      });
      sync();
      if (!restored && saved?.currentTime && saved.currentTime > 5) {
        const safe = Number.isFinite(video.duration) && video.duration > 0
          ? Math.min(saved.currentTime, video.duration - 3)
          : saved.currentTime;
        video.currentTime = safe;
        setCurrentTime(safe);
      }
      const initialSubtitleIndex = Array.from(video.textTracks).findIndex((track) => track.mode === "showing");
      if (initialSubtitleIndex >= 0) {
        setSelectedSub(initialSubtitleIndex);
      }
      syncTextTracks();
      syncAudioTracks();
      setRestored(true);
    }

    function onPlay() {
      const externalAudio = externalAudioRef.current;
      if (selectedExternalAudioId !== null && externalAudio) {
        externalAudio.currentTime = video.currentTime;
        externalAudio.playbackRate = video.playbackRate;
        void externalAudio.play().catch(() => {});
      }
      setPlaying(true);
    }
    function onPause() {
      const externalAudio = externalAudioRef.current;
      externalAudio?.pause();
      if (!p) return;
      setPlaying(false);
      if (p.currentTime > 0) writeProgress(storageKey, { title: effectiveTitle, currentTime: p.currentTime, duration: Number.isFinite(p.duration) ? p.duration : 0, updatedAt: new Date().toISOString(), posterUrl, episodeNumber: effectiveEpisodeNumber, episodeTotal: effectiveEpisodeTotal });
      setShowControls(true);
    }
    function onEnded() {
      const externalAudio = externalAudioRef.current;
      externalAudio?.pause();
      externalAudio?.removeAttribute("src");
      writeProgress(storageKey, { title: effectiveTitle, currentTime: 0, duration: 0, updatedAt: new Date().toISOString(), posterUrl, episodeNumber: effectiveEpisodeNumber, episodeTotal: effectiveEpisodeTotal });
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
      if (!externalAudio || selectedExternalAudioId === null) {
        return;
      }
      externalAudio.currentTime = video.currentTime;
      if (!video.paused) {
        void externalAudio.play().catch(() => {});
      }
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
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("ratechange", onRateChange);
    video.textTracks.addEventListener("change", onTextTrackListChange);
    video.textTracks.addEventListener("addtrack", onTextTrackListChange as EventListener);
    video.textTracks.addEventListener("removetrack", onTextTrackListChange as EventListener);
    (video as HTMLVideoElementWithAudioTracks).audioTracks?.addEventListener("change", onAudioTrackListChange);
    (video as HTMLVideoElementWithAudioTracks).audioTracks?.addEventListener("addtrack", onAudioTrackListChange);
    (video as HTMLVideoElementWithAudioTracks).audioTracks?.addEventListener("removetrack", onAudioTrackListChange);

    const interval = window.setInterval(() => {
      if (!video.paused && video.currentTime > 0)
        writeProgress(storageKey, { title: effectiveTitle, currentTime: video.currentTime, duration: Number.isFinite(video.duration) ? video.duration : 0, updatedAt: new Date().toISOString(), posterUrl, episodeNumber: effectiveEpisodeNumber, episodeTotal: effectiveEpisodeTotal });
    }, 5000);

    return () => {
      window.clearInterval(interval);
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("volumechange", onVol);
      video.removeEventListener("progress", onProg);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("ratechange", onRateChange);
      video.textTracks.removeEventListener("change", onTextTrackListChange);
      video.textTracks.removeEventListener("addtrack", onTextTrackListChange as EventListener);
      video.textTracks.removeEventListener("removetrack", onTextTrackListChange as EventListener);
      (video as HTMLVideoElementWithAudioTracks).audioTracks?.removeEventListener("change", onAudioTrackListChange);
      (video as HTMLVideoElementWithAudioTracks).audioTracks?.removeEventListener("addtrack", onAudioTrackListChange);
      (video as HTMLVideoElementWithAudioTracks).audioTracks?.removeEventListener("removetrack", onAudioTrackListChange);
    };
  }, [restored, saved, storageKey, subtitles, effectiveTitle, posterUrl, effectiveEpisodeNumber, effectiveEpisodeTotal, preferredSubtitleLabel, muted, selectedExternalAudioId]);

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
      void audio.play().catch(() => {});
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

  function togglePlay() {
    const p = playerRef.current;
    const externalAudio = externalAudioRef.current;
    if (!p) return;
    if (p.paused) {
      void p.play();
      if (selectedExternalAudioId !== null && externalAudio) {
        externalAudio.currentTime = p.currentTime;
        void externalAudio.play().catch(() => {});
      }
      scheduleHide();
    } else {
      p.pause();
      externalAudio?.pause();
    }
  }

  function seek(t: number) {
    const p = playerRef.current;
    const externalAudio = externalAudioRef.current;
    if (!p) return;
    p.currentTime = t;
    if (selectedExternalAudioId !== null && externalAudio) {
      externalAudio.currentTime = t;
    }
    setCurrentTime(t);
  }

  function seekBy(d: number) {
    const p = playerRef.current;
    if (!p) return;
    seek(Math.max(0, Math.min(p.currentTime + d, duration || p.duration || 0)));
  }

  function setVol(v: number) {
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
    const c = containerRef.current;
    if (!c) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await c.requestFullscreen();
  }

  function selectSub(idx: number | null) {
    const p = playerRef.current;
    if (!p) return;
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
    setSelectedSub(idx);
    setSubMenu(false);
  }

  function selectAudio(id: number) {
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

  function selectExternalAudio(id: number) {
    const video = playerRef.current;
    const audio = externalAudioRef.current;
    const selectedTrack = externalAudioTracks.find((track) => track.id === id);
    if (!video || !audio || !selectedTrack) return;

    onSelectExternalAudio?.(id);
    setSelectedAudio(null);
    setAudioMenu(false);

    audio.src = selectedTrack.src;
    audio.currentTime = video.currentTime;
    audio.volume = volume;
    audio.muted = muted;
    video.muted = true;

    if (!video.paused) {
      void audio.play().catch(() => {});
    }
  }

  const playedPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;
  const volPct = muted ? 0 : volume;
  const hasSubtitleOptions = subtitles.length > 0 || textTracks.length > 0 || backendSubtitleOptions.length > 0;
  const hasAudioOptions = audioTracks.length > 0 || backendAudioOptions.length > 0;

  const btnCls = "flex items-center justify-center rounded p-1.5 text-white/80 transition-colors hover:text-white hover:bg-white/10";

  return (
    <div
      ref={containerRef}
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "#000", overflow: "hidden" }}
      onMouseMove={reveal}
      onMouseLeave={() => { if (playing) setShowControls(false); }}
    >
      <video
        ref={playerRef}
        preload="metadata"
        poster={posterUrl}
        style={{ width: "100%", height: "100%", display: "block", objectFit: "contain", background: "#000" }}
        src={streamUrl}
        onClick={togglePlay}
      >
        {subtitles.map((s) => (
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
      <audio ref={externalAudioRef} preload="metadata" style={{ display: "none" }} />

      {/* gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

      {/* controls */}
      <div
        className="absolute inset-0 flex flex-col justify-between transition-opacity duration-200"
        style={{ opacity: showControls ? 1 : 0, pointerEvents: showControls ? "auto" : "none" }}
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
              className={`${btnCls} ${selectedSub !== null ? "text-white" : ""} ${!hasSubtitleOptions ? "opacity-60" : ""}`}
              aria-label="Subtitles"
              title="Subtitles"
            >
              <IconCC size={20} />
            </button>
            {subMenu && (
              <div className="absolute bottom-10 right-0 z-20 min-w-[220px] rounded-lg border border-white/10 bg-[#1a1a1a] py-1 shadow-xl">
                {textTracks.length > 0 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => selectSub(null)}
                      className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-white/8 ${selectedSub === null ? "text-white" : "text-[var(--muted)]"}`}
                    >
                      Off
                    </button>
                    {textTracks.map(track => (
                      <button
                        key={track.id}
                        type="button"
                        onClick={() => selectSub(track.id)}
                        className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-white/8 ${selectedSub === track.id ? "text-white" : "text-[var(--muted)]"}`}
                      >
                        {track.label}
                      </button>
                    ))}
                    {backendSubtitleOptions.length > 0 ? (
                      <>
                        <div className="mx-3 my-2 h-px bg-white/10" />
                        <p className="px-4 pb-1 text-[10px] uppercase tracking-[0.2em] text-white/35">
                          Extract from source
                        </p>
                        {backendSubtitleOptions.map((track) => (
                          <button
                            key={track.id}
                            type="button"
                            onClick={() => {
                              setSubMenu(false);
                              onExtractSubtitle?.(track.id);
                            }}
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
                    {backendSubtitleOptions.length > 0 ? (
                      <>
                        <button
                          type="button"
                          onClick={() => selectSub(null)}
                          className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-white/8 ${selectedSub === null ? "text-white" : "text-[var(--muted)]"}`}
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
                            className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm transition-colors hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <span className="min-w-0 truncate text-[var(--muted)]">{track.label}</span>
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
            )}
          </div>

          {/* audio tracks */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setAudioMenu(v => !v); setSubMenu(false); }}
              className={`${btnCls} ${!hasAudioOptions ? "opacity-60" : ""}`}
              aria-label="Audio tracks"
              title="Audio tracks"
            >
              <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </button>
            {audioMenu && (
              <div className="absolute bottom-10 right-0 z-20 min-w-[220px] rounded-lg border border-white/10 bg-[#1a1a1a] py-1 shadow-xl">
                {audioTracks.length > 0 ? (
                  <>
                    {audioTracks.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => selectAudio(t.id)}
                        className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-white/8 ${selectedAudio === t.id && selectedExternalAudioId === null ? "text-white" : "text-[var(--muted)]"}`}
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
                            className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-white/8 ${selectedExternalAudioId === track.id ? "text-white" : "text-[var(--muted)]"}`}
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
                    {backendAudioOptions.length > 0 ? (
                      <>
                        {externalAudioTracks.length > 0 ? (
                          externalAudioTracks.map((track) => (
                            <button
                              key={track.id}
                              type="button"
                              onClick={() => selectExternalAudio(track.id)}
                              className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-white/8 ${selectedExternalAudioId === track.id ? "text-white" : "text-[var(--muted)]"}`}
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
        style={{ opacity: showControls && !playing ? 1 : 0, transition: "opacity 0.2s" }}
      >
        <div className="rounded-full bg-black/50 p-5">
          <IconPlay size={36} />
        </div>
      </div>

      {subtitleLoadingLabel ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-[28px] border border-white/12 bg-black/58 px-6 py-5 text-center shadow-2xl backdrop-blur-xl">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/18 border-t-white" />
            <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-white/45">Loading subtitles</p>
            <p className="mt-1 max-w-[18rem] text-sm text-white/88">{subtitleLoadingLabel}</p>
          </div>
        </div>
      ) : null}

      {audioLoadingLabel ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-[28px] border border-white/12 bg-black/58 px-6 py-5 text-center shadow-2xl backdrop-blur-xl">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/18 border-t-white" />
            <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-white/45">Loading audio</p>
            <p className="mt-1 max-w-[18rem] text-sm text-white/88">{audioLoadingLabel}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
