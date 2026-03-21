"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { BackendWatchSession } from "@/lib/media-backend/types";

type ResumeWatchProgressProps = {
  session: BackendWatchSession;
};

type ResolveResponse = {
  ok: boolean;
  resolution?: {
    session: BackendWatchSession;
    rehydrated: boolean;
  };
  error?: string;
};

function buildWatchTarget(session: BackendWatchSession): string {
  const hash = session.torrentHash ?? "unknown";
  const params = new URLSearchParams({
    file: String(session.fileIndex),
    session: session.sessionKey,
  });

  if (session.posterUrl) {
    params.set("poster", session.posterUrl);
  }
  if (session.title) {
    params.set("title", session.title);
  }
  if (session.episodeNumber != null) {
    params.set("ep", String(session.episodeNumber));
  }
  if (session.episodeTotal != null) {
    params.set("eps", String(session.episodeTotal));
  }

  return `/watch/${hash}?${params.toString()}`;
}

export function ResumeWatchProgress({ session }: ResumeWatchProgressProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<"reconnecting" | "buffering" | "ready" | "error">("reconnecting");
  const [error, setError] = useState<string | null>(null);

  const displayTitle =
    session.episodeNumber != null
      ? `${session.title ?? "Untitled"} \u00b7 Episode ${session.episodeNumber}`
      : session.title ?? "Untitled";

  const progressValue =
    phase === "reconnecting" ? 30 :
    phase === "buffering" ? 70 :
    phase === "ready" ? 97 :
    100;

  const phaseLabel =
    phase === "reconnecting" ? "Reconnecting" :
    phase === "buffering" ? "Buffering" :
    phase === "ready" ? "Opening player" :
    null;

  useEffect(() => {
    let cancelled = false;

    async function resume() {
      try {
        const response = await fetch("/api/media-backend/watch-sessions/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionKey: session.sessionKey }),
        });

        if (cancelled) return;

        const payload = (await response.json()) as ResolveResponse;

        if (!response.ok || !payload.ok) {
          throw new Error(payload.error ?? "Failed to reconnect to source.");
        }

        const resolved = payload.resolution?.session;
        if (!resolved?.sourceUrl) {
          throw new Error("Source is no longer available.");
        }

        if (cancelled) return;

        setPhase("buffering");

        await new Promise((r) => window.setTimeout(r, 800));
        if (cancelled) return;

        setPhase("ready");

        const target = buildWatchTarget(resolved);
        router.prefetch(target);

        await new Promise((r) => window.setTimeout(r, 300));
        if (cancelled) return;

        router.replace(target);

        window.setTimeout(() => {
          const targetPathname = new URL(target, window.location.origin).pathname;
          if (window.location.pathname !== targetPathname) {
            window.location.assign(target);
          }
        }, 3000);
      } catch (err) {
        if (!cancelled) {
          setPhase("error");
          setError(err instanceof Error ? err.message : "Failed to resume playback.");
        }
      }
    }

    void resume();

    return () => {
      cancelled = true;
    };
  }, [session.sessionKey, router]);

  return (
    <main className="fixed inset-0 flex items-center justify-center bg-[#0a0a0a]">
      {session.posterUrl ? (
        <img
          src={session.posterUrl}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          style={{ opacity: 0.06, filter: "blur(40px) saturate(1.2)" }}
        />
      ) : null}

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center px-6">
        {/* Progress bar */}
        {phase !== "error" ? (
          <div className="w-full">
            <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-white/70 transition-[width] duration-700 ease-out"
                style={{ width: `${progressValue}%` }}
              />
            </div>
          </div>
        ) : null}

        {/* Phase label */}
        {phase !== "error" && phaseLabel ? (
          <p className="mt-5 text-[13px] font-medium text-white/60">{phaseLabel}</p>
        ) : null}

        {/* Error state */}
        {phase === "error" ? (
          <>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/10">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <p className="mt-4 text-[13px] text-white/40">{error}</p>
          </>
        ) : null}

        {/* Title */}
        <p className="mt-4 max-w-[300px] truncate text-center text-[12px] text-white/25">
          {displayTitle}
        </p>

        {/* Back button on error */}
        {phase === "error" ? (
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-6 rounded-full px-5 py-2 text-[13px] font-medium text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white/70"
          >
            Go back
          </button>
        ) : null}
      </div>
    </main>
  );
}
