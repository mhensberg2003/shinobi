"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type MpvTrack = {
  id: number;
  type: "video" | "audio" | "sub";
  codec?: string;
  language?: string;
  title?: string;
  selected: boolean;
  default: boolean;
  external: boolean;
};

type MpvPlayerProps = {
  storageKey: string;
  sessionKey?: string;
  title: string;
  streamUrl: string;
  posterUrl?: string;
  episodeNumber?: number;
  episodeTotal?: number;
  magnetLink?: string;
  torrentHash: string;
  fileIndex: number;
};

type StoredProgress = {
  title: string;
  currentTime: number;
  duration: number;
  updatedAt: string;
  posterUrl?: string;
  episodeNumber?: number;
  episodeTotal?: number;
  sessionKey?: string;
};

const KEYBOARD_SEEK_SECONDS = 10;

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

function writeProgress(key: string, p: StoredProgress) {
  try { localStorage.setItem(key, JSON.stringify(p)); } catch {}
}

function isKeyboardShortcutTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return true;
  if (target.isContentEditable) return false;
  const tagName = target.tagName;
  return tagName !== "INPUT" && tagName !== "TEXTAREA" && tagName !== "SELECT";
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

function getMpvApi() {
  return window.electronAPI?.mpv ?? null;
}

export function MpvPlayer({
  storageKey,
  sessionKey,
  title,
  streamUrl,
  posterUrl,
  episodeNumber,
  episodeTotal,
  magnetLink,
  torrentHash,
  fileIndex,
}: MpvPlayerProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hideTimer = useRef<number | null>(null);
  const progressInterval = useRef<number | null>(null);

  const [saved] = useState(() => readProgress(storageKey));
  const hasResumePoint = Boolean(saved?.currentTime && saved.currentTime > 5);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFs, setIsFs] = useState(false);
  const [subMenu, setSubMenu] = useState(false);
  const [audioMenu, setAudioMenu] = useState(false);

  const [subtitleTracks, setSubtitleTracks] = useState<MpvTrack[]>([]);
  const [audioTracks, setAudioTracks] = useState<MpvTrack[]>([]);
  const [selectedSub, setSelectedSub] = useState<number | false>(false);
  const [selectedAudio, setSelectedAudio] = useState<number>(1);

  const topBarTitle =
    episodeNumber != null
      ? `${title} \u2022 Episode ${episodeNumber}${episodeTotal != null ? `/${episodeTotal}` : ""}`
      : title;

  // Spawn mpv and set up property listeners
  useEffect(() => {
    const mpv = getMpvApi();
    if (!mpv) return;

    let cancelled = false;

    async function init() {
      const startTime = hasResumePoint ? saved!.currentTime : undefined;
      try {
        const tracks = await mpv!.spawn(streamUrl, { startTime });
        if (cancelled) return;

        const subs = tracks.filter((t) => t.type === "sub");
        const audio = tracks.filter((t) => t.type === "audio");
        setSubtitleTracks(subs);
        setAudioTracks(audio);

        const activeSub = subs.find((t) => t.selected);
        setSelectedSub(activeSub ? activeSub.id : false);

        const activeAudio = audio.find((t) => t.selected);
        if (activeAudio) setSelectedAudio(activeAudio.id);

        setReady(true);
      } catch (err) {
        console.error("[mpv-player] spawn failed", err);
      }
    }

    void init();

    const unsubProperty = mpv.onPropertyChange((prop, value) => {
      if (cancelled) return;
      switch (prop) {
        case "time-pos":
          if (typeof value === "number") setCurrentTime(value);
          break;
        case "duration":
          if (typeof value === "number") setDuration(value);
          break;
        case "pause":
          if (typeof value === "boolean") setPlaying(!value);
          break;
        case "volume":
          if (typeof value === "number") setVolume(value);
          break;
        case "mute":
          if (typeof value === "boolean") setMuted(value);
          break;
        case "track-list":
          if (Array.isArray(value)) {
            const tracks = value as MpvTrack[];
            setSubtitleTracks(tracks.filter((t) => t.type === "sub"));
            setAudioTracks(tracks.filter((t) => t.type === "audio"));
          }
          break;
        case "eof-reached":
          if (value === true) {
            setPlaying(false);
          }
          break;
      }
    });

    const unsubEndFile = mpv.onEndFile(() => {
      if (!cancelled) setPlaying(false);
    });

    return () => {
      cancelled = true;
      unsubProperty();
      unsubEndFile();
      mpv.quit().catch(() => {});
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamUrl]);

  // Save progress periodically
  useEffect(() => {
    if (!ready) return;

    progressInterval.current = window.setInterval(() => {
      if (duration > 0 && currentTime > 0) {
        writeProgress(storageKey, {
          title,
          currentTime,
          duration,
          updatedAt: new Date().toISOString(),
          posterUrl,
          episodeNumber,
          episodeTotal,
          sessionKey,
        });
      }
    }, 5000);

    return () => {
      if (progressInterval.current) window.clearInterval(progressInterval.current);
    };
  }, [ready, storageKey, title, currentTime, duration, posterUrl, episodeNumber, episodeTotal, sessionKey]);

  // Watch session heartbeat
  useEffect(() => {
    if (!sessionKey || !magnetLink) return;

    async function sendHeartbeat(progressSeconds: number, durationSeconds: number) {
      await fetch("/api/media-backend/watch-sessions/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionKey,
          magnetLink,
          fileIndex,
          torrentHash,
          title,
          posterUrl,
          episodeNumber,
          episodeTotal,
          progressSeconds,
          durationSeconds,
        }),
      }).catch(() => {});
    }

    void sendHeartbeat(currentTime, duration);

    const interval = window.setInterval(() => {
      void sendHeartbeat(currentTime, duration);
    }, 30_000);

    function deactivate() {
      navigator.sendBeacon(
        "/api/media-backend/watch-sessions/deactivate",
        new Blob([JSON.stringify({
          sessionKey,
          magnetLink,
          fileIndex,
          torrentHash,
          title,
          posterUrl,
          episodeNumber,
          episodeTotal,
          progressSeconds: currentTime,
          durationSeconds: duration,
        })], { type: "application/json" }),
      );
    }

    window.addEventListener("pagehide", deactivate);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("pagehide", deactivate);
      deactivate();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionKey, magnetLink, fileIndex, torrentHash, title, posterUrl, episodeNumber, episodeTotal]);

  // Fullscreen listener
  useEffect(() => {
    const handler = () => setIsFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Controls auto-hide
  function scheduleHide() {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (playing) setShowControls(false);
    }, 2500);
  }

  function reveal() { setShowControls(true); scheduleHide(); }

  // Playback controls
  function togglePlay() {
    const mpv = getMpvApi();
    if (!mpv || !ready) return;
    void mpv.togglePause();
  }

  function seek(t: number) {
    const mpv = getMpvApi();
    if (!mpv || !ready) return;
    const clamped = Math.max(0, Math.min(t, duration));
    void mpv.seekAbsolute(clamped);
    setCurrentTime(clamped);
  }

  function seekBy(d: number) {
    const mpv = getMpvApi();
    if (!mpv || !ready) return;
    void mpv.seek(d);
  }

  function setVol(v: number) {
    const mpv = getMpvApi();
    if (!mpv || !ready) return;
    const percent = Math.round(v * 100);
    void mpv.setVolume(percent);
    setVolume(percent);
  }

  function toggleMute() {
    const mpv = getMpvApi();
    if (!mpv || !ready) return;
    void mpv.setMute(!muted);
  }

  async function toggleFs() {
    const c = containerRef.current;
    if (!c) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await c.requestFullscreen();
  }

  function selectSubtitle(id: number | false) {
    const mpv = getMpvApi();
    if (!mpv || !ready) return;
    void mpv.setSubtitleTrack(id);
    setSelectedSub(id);
    setSubMenu(false);
  }

  function selectAudioTrack(id: number) {
    const mpv = getMpvApi();
    if (!mpv || !ready) return;
    void mpv.setAudioTrack(id);
    setSelectedAudio(id);
    setAudioMenu(false);
  }

  // Keyboard shortcuts
  const onKeyboardShortcut = useEffectEvent((event: KeyboardEvent) => {
    if (event.defaultPrevented || !isKeyboardShortcutTarget(event.target)) return;

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
    if (event.key === "f" || event.key === "F") {
      event.preventDefault();
      void toggleFs();
      reveal();
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", onKeyboardShortcut);
    return () => window.removeEventListener("keydown", onKeyboardShortcut);
  }, []);

  const playedPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volPct = muted ? 0 : volume / 100;
  const hasSubtitleOptions = subtitleTracks.length > 0;
  const hasAudioOptions = audioTracks.length > 0;

  const btnCls = "flex items-center justify-center rounded p-1.5 text-white/80 transition-colors hover:text-white hover:bg-white/10";

  return (
    <div
      ref={containerRef}
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "#000", overflow: "hidden" }}
      onMouseMove={reveal}
      onMouseLeave={() => { if (playing) setShowControls(false); }}
    >
      {/* mpv renders in its own window — this is just the overlay UI */}

      {!ready ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/18 border-t-white" />
        </div>
      ) : null}

      {/* gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

      {/* controls */}
      <div
        className="absolute inset-0 flex flex-col justify-between transition-opacity duration-200"
        style={{ opacity: showControls && ready ? 1 : 0, pointerEvents: showControls && ready ? "auto" : "none" }}
        onClick={(event) => {
          if (event.target === event.currentTarget) togglePlay();
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
              className={`${btnCls} ${selectedSub !== false ? "text-white" : ""} ${!hasSubtitleOptions ? "opacity-60" : ""}`}
              aria-label="Subtitles"
              title="Subtitles"
            >
              <IconCC size={20} />
            </button>
            {subMenu && (
              <div className="absolute bottom-10 right-0 z-20 min-w-[220px] rounded-lg border border-white/10 bg-[#1a1a1a] py-1 shadow-xl">
                <div className="h-[min(18rem,calc(100vh-10rem))] overflow-y-auto overscroll-contain" style={{ scrollbarWidth: "none" }}>
                  {subtitleTracks.length > 0 ? (
                    <>
                      <button
                        type="button"
                        onClick={() => selectSubtitle(false)}
                        className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-white/8 ${selectedSub === false ? "bg-white/10 font-medium text-white" : "text-[var(--muted)]"}`}
                      >
                        Off
                      </button>
                      {subtitleTracks.map(track => (
                        <button
                          key={track.id}
                          type="button"
                          onClick={() => selectSubtitle(track.id)}
                          className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-white/8 ${selectedSub === track.id ? "bg-white/10 font-medium text-white" : "text-[var(--muted)]"}`}
                        >
                          {track.title || track.language || `Subtitle ${track.id}`}
                        </button>
                      ))}
                    </>
                  ) : (
                    <p className="px-4 py-3 text-sm text-[var(--muted)]">
                      No subtitle tracks detected.
                    </p>
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
                <div className="h-[min(18rem,calc(100vh-10rem))] overflow-y-auto overscroll-contain" style={{ scrollbarWidth: "none" }}>
                  {audioTracks.length > 0 ? (
                    audioTracks.map(track => (
                      <button
                        key={track.id}
                        type="button"
                        onClick={() => selectAudioTrack(track.id)}
                        className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-white/8 ${selectedAudio === track.id ? "bg-white/10 font-medium text-white" : "text-[var(--muted)]"}`}
                      >
                        {track.title || track.language || `Audio ${track.id}`}
                      </button>
                    ))
                  ) : (
                    <p className="px-4 py-3 text-sm text-[var(--muted)]">
                      No audio tracks detected.
                    </p>
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

      {/* center play/pause icon */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity: ready && showControls && !playing ? 1 : 0, transition: "opacity 0.2s" }}
      >
        <div className="rounded-full bg-black/50 p-5 text-white">
          <IconPlay size={36} />
        </div>
      </div>
    </div>
  );
}
