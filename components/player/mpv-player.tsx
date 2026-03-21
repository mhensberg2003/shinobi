"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

function readProgress(key: string): StoredProgress | null {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; } catch { return null; }
}

function writeProgress(key: string, p: Partial<StoredProgress> & { currentTime: number; duration: number }) {
  try {
    const existing = readProgress(key);
    const next: StoredProgress = {
      title: p.title ?? existing?.title ?? "Untitled",
      currentTime: p.currentTime,
      duration: p.duration,
      updatedAt: new Date().toISOString(),
      posterUrl: p.posterUrl ?? existing?.posterUrl,
      episodeNumber: p.episodeNumber ?? existing?.episodeNumber,
      episodeTotal: p.episodeTotal ?? existing?.episodeTotal,
      sessionKey: p.sessionKey ?? existing?.sessionKey,
    };
    localStorage.setItem(key, JSON.stringify(next));
  } catch {}
}

export function MpvPlayer({
  storageKey,
  sessionKey,
  title,
  streamUrl,
  posterUrl,
  episodeNumber,
  episodeTotal,
}: MpvPlayerProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"launching" | "playing" | "ended" | "error">("launching");
  const [errorMsg, setErrorMsg] = useState("");

  const saved = readProgress(storageKey);
  const hasResumePoint = Boolean(saved?.currentTime && saved.currentTime > 5);

  const displayTitle = episodeNumber != null
    ? `Episode ${episodeNumber}`
    : null;

  useEffect(() => {
    const mpv = window.electronAPI?.mpv;
    if (!mpv) return;

    const startTime = hasResumePoint ? saved!.currentTime : undefined;
    let active = true;

    mpv.spawn(streamUrl, { startTime })
      .then(() => { if (active) setStatus("playing"); })
      .catch((err) => {
        if (!active) return;
        setStatus("error");
        setErrorMsg(err instanceof Error ? err.message : String(err));
      });

    const unsubEnded = mpv.onEnded(() => {
      if (active) setStatus("ended");
    });

    const unsubProgress = mpv.onProgress((data) => {
      if (!active) return;
      writeProgress(storageKey, {
        title,
        currentTime: data.currentTime,
        duration: data.duration,
        posterUrl,
        episodeNumber,
        episodeTotal,
        sessionKey,
      });
    });

    return () => {
      active = false;
      unsubEnded();
      unsubProgress();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamUrl]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a0a]">
      {posterUrl ? (
        <img
          src={posterUrl}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          style={{ opacity: 0.08, filter: "blur(40px) saturate(1.2)" }}
        />
      ) : null}

      <div className="relative z-10 flex flex-col items-center px-6">
        {/* Icon */}
        {status === "launching" ? (
          <div className="h-10 w-10 animate-spin rounded-full border-[2.5px] border-white/10 border-t-white/70" />
        ) : status === "playing" ? (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white" opacity="0.5">
              <polygon points="6,4 20,12 6,20" />
            </svg>
          </div>
        ) : status === "ended" ? (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5">
              <polyline points="5,13 9,17 19,7" />
            </svg>
          </div>
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
        )}

        {/* Title */}
        <p className="mt-5 text-[15px] font-medium text-white/90">
          {status === "launching" ? "Opening in mpv" : status === "playing" ? "Now playing" : status === "ended" ? "Finished" : "Playback failed"}
        </p>

        {/* Subtitle info */}
        <p className="mt-1.5 max-w-[320px] truncate text-center text-[13px] text-white/40">
          {title}{displayTitle ? ` \u00b7 ${displayTitle}` : ""}
        </p>

        {/* Error detail */}
        {status === "error" && errorMsg ? (
          <p className="mt-3 max-w-[360px] text-center text-xs text-white/25">{errorMsg}</p>
        ) : null}

        {/* Back button */}
        <button
          type="button"
          onClick={() => {
            window.electronAPI?.mpv.quit().catch(() => {});
            router.back();
          }}
          className="mt-7 rounded-full px-5 py-2 text-[13px] font-medium text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white/70"
        >
          {status === "ended" ? "Done" : "Back"}
        </button>
      </div>
    </div>
  );
}
