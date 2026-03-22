"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type MpvPlayerProps = {
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
};

export function MpvPlayer({
  resumeTime,
  sessionKey,
  title,
  streamUrl,
  posterUrl,
  episodeNumber,
}: MpvPlayerProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"launching" | "playing" | "ended" | "error">("launching");
  const [errorMsg, setErrorMsg] = useState("");
  const [embedded, setEmbedded] = useState(false);
  const [progress, setProgress] = useState<{ currentTime: number; duration: number } | null>(null);

  const hasResumePoint = Boolean(resumeTime && resumeTime > 5);

  const displayTitle = episodeNumber != null
    ? `Episode ${episodeNumber}`
    : null;

  // Spawn mpv on mount
  useEffect(() => {
    const mpv = window.electronAPI?.mpv;
    if (!mpv) return;

    const startTime = hasResumePoint ? resumeTime : undefined;
    let active = true;

    mpv.spawn(streamUrl, { startTime })
      .then((result) => {
        if (!active) return;
        setStatus("playing");
        setEmbedded(result.embedded);
      })
      .catch((err) => {
        if (!active) return;
        setStatus("error");
        setErrorMsg(err instanceof Error ? err.message : String(err));
      });

    const unsubEnded = mpv.onEnded(() => {
      if (active) setStatus("ended");
    });

    const unsubBack = mpv.onBack(() => {
      if (active) router.back();
    });

    const unsubProgress = mpv.onProgress((data) => {
      if (active) setProgress(data);
    });

    return () => {
      active = false;
      unsubEnded();
      unsubBack();
      unsubProgress();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamUrl]);

  // Heartbeat for resume tracking
  useEffect(() => {
    if (!sessionKey || !progress) return;

    const interval = setInterval(() => {
      if (!progress) return;
      fetch("/api/media-backend/watch-sessions/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionKey,
          progressSeconds: progress.currentTime,
          durationSeconds: progress.duration,
        }),
      }).catch(() => {});
    }, 30_000);

    return () => clearInterval(interval);
  }, [sessionKey, progress]);

  // When mpv is embedded and playing, it covers the entire window.
  // Show a minimal black background — the user interacts with mpv directly
  // (OSC controls on mouse move, keyboard shortcuts).
  // When mpv exits, the "finished" UI shows.
  if (embedded && status === "playing") {
    return <div className="fixed inset-0 z-[100] bg-black" />;
  }

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

        <p className="mt-5 text-[15px] font-medium text-white/90">
          {status === "launching" ? "Loading" : status === "playing" ? "Now playing" : status === "ended" ? "Finished" : "Playback failed"}
        </p>

        <p className="mt-1.5 max-w-[320px] truncate text-center text-[13px] text-white/40">
          {title}{displayTitle ? ` · ${displayTitle}` : ""}
        </p>

        {status === "error" && errorMsg ? (
          <p className="mt-3 max-w-[360px] text-center text-xs text-white/25">{errorMsg}</p>
        ) : null}

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
