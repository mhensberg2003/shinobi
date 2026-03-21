"use client";

import { useEffect, useRef, useState } from "react";
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

export function MpvPlayer({
  storageKey,
  title,
  streamUrl,
  posterUrl,
  episodeNumber,
  episodeTotal,
}: MpvPlayerProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"launching" | "playing" | "ended" | "error">("launching");
  const [errorMsg, setErrorMsg] = useState("");
  const spawnedRef = useRef(false);

  const saved = readProgress(storageKey);
  const hasResumePoint = Boolean(saved?.currentTime && saved.currentTime > 5);

  const displayTitle =
    episodeNumber != null
      ? `${title} \u2022 Episode ${episodeNumber}${episodeTotal != null ? `/${episodeTotal}` : ""}`
      : title;

  useEffect(() => {
    const mpv = window.electronAPI?.mpv;
    if (!mpv || spawnedRef.current) return;
    spawnedRef.current = true;

    const startTime = hasResumePoint ? saved!.currentTime : undefined;

    mpv.spawn(streamUrl, { startTime })
      .then(() => setStatus("playing"))
      .catch((err) => {
        setStatus("error");
        setErrorMsg(err instanceof Error ? err.message : String(err));
      });

    const unsubEnded = mpv.onEnded(() => {
      setStatus("ended");
    });

    return () => {
      unsubEnded();
      mpv.quit().catch(() => {});
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamUrl]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>

      {posterUrl ? (
        <img
          src={posterUrl}
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.15, filter: "blur(30px)", pointerEvents: "none" }}
        />
      ) : null}

      <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 480, padding: "0 24px" }}>
        {status === "launching" ? (
          <>
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/18 border-t-white" />
            <p className="mt-5 text-lg font-medium text-white">Opening in mpv</p>
            <p className="mt-2 text-sm text-white/50">{displayTitle}</p>
          </>
        ) : status === "playing" ? (
          <>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5,3 19,12 5,21" fill="rgba(255,255,255,0.6)" />
            </svg>
            <p className="mt-5 text-lg font-medium text-white">Playing in mpv</p>
            <p className="mt-2 text-sm text-white/50">{displayTitle}</p>
            <p className="mt-6 text-xs text-white/30">Video is playing in a separate mpv window. Close it or press back to return.</p>
          </>
        ) : status === "ended" ? (
          <>
            <p className="text-lg font-medium text-white">Playback ended</p>
            <p className="mt-2 text-sm text-white/50">{displayTitle}</p>
          </>
        ) : (
          <>
            <p className="text-lg font-medium text-red-400">Failed to open mpv</p>
            <p className="mt-2 text-sm text-white/50">{errorMsg}</p>
          </>
        )}

        <button
          type="button"
          onClick={() => router.back()}
          className="mt-8 rounded-lg bg-white/10 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/18"
        >
          Back
        </button>
      </div>
    </div>
  );
}
