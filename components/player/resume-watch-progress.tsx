"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { BackendAutoResolveStatus, BackendWatchSession } from "@/lib/media-backend/types";

type ResumeWatchProgressProps = {
  sessionKey: string;
};

type SessionMeta = {
  title?: string;
  posterUrl?: string;
  episodeNumber?: number;
  episodeTotal?: number;
};

type SessionResponse = {
  ok: boolean;
  session?: BackendWatchSession;
  error?: string;
};

type ResolveResponse = {
  ok: boolean;
  resolution?: {
    session: BackendWatchSession;
    rehydrated: boolean;
  };
  error?: string;
};

type AutoResolveStatusResponse = {
  ok: boolean;
  status?: BackendAutoResolveStatus;
  error?: string;
};

const PHASE_PROGRESS: Partial<Record<string, number>> = {
  reconnecting: 20,
  searching: 30,
  ranking: 42,
  "trying-candidate": 54,
  "fetching-metadata": 62,
  "picking-file": 70,
  "selecting-file": 76,
  "waiting-for-playable": 82,
  buffering: 88,
  probing: 94,
  finalizing: 97,
  ready: 97,
};

const PHASE_LABELS: Partial<Record<string, string>> = {
  reconnecting: "Reconnecting",
  searching: "Searching",
  ranking: "Ranking results",
  "trying-candidate": "Trying source",
  "fetching-metadata": "Fetching metadata",
  "picking-file": "Selecting file",
  "selecting-file": "Selecting file",
  "waiting-for-playable": "Buffering",
  buffering: "Buffering",
  probing: "Almost ready",
  finalizing: "Opening player",
  ready: "Opening player",
};

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function buildWatchTarget(session: BackendWatchSession): string {
  const hash = session.torrentHash ?? "unknown";
  const params = new URLSearchParams({
    file: String(session.fileIndex),
    session: session.sessionKey,
  });
  if (session.posterUrl) params.set("poster", session.posterUrl);
  if (session.title) params.set("title", session.title);
  if (session.episodeNumber != null) params.set("ep", String(session.episodeNumber));
  if (session.episodeTotal != null) params.set("eps", String(session.episodeTotal));
  return `/watch/${hash}?${params.toString()}`;
}

function navigateToWatch(router: ReturnType<typeof useRouter>, target: string) {
  router.replace(target);
  window.setTimeout(() => {
    const targetPathname = new URL(target, window.location.origin).pathname;
    if (window.location.pathname !== targetPathname) {
      window.location.assign(target);
    }
  }, 3000);
}

async function pollAutoResolveStatus(requestKey: string): Promise<BackendAutoResolveStatus | null> {
  const response = await fetch(
    `/api/media-backend/watch/auto-resolve/status?requestKey=${encodeURIComponent(requestKey)}`,
    { cache: "no-store" },
  );
  if (response.status === 404) return null;
  const payload = (await response.json()) as AutoResolveStatusResponse;
  if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Failed to read status.");
  return payload.status ?? null;
}

export function ResumeWatchProgress({ sessionKey }: ResumeWatchProgressProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<string>("reconnecting");
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<SessionMeta | null>(null);

  // Load session metadata for display
  useEffect(() => {
    fetch(`/api/media-backend/watch-sessions/${encodeURIComponent(sessionKey)}`)
      .then((r) => r.json())
      .then((data: SessionResponse) => {
        if (data.ok && data.session) {
          setMeta({
            title: data.session.title,
            posterUrl: data.session.posterUrl,
            episodeNumber: data.session.episodeNumber,
            episodeTotal: data.session.episodeTotal,
          });
        }
      })
      .catch(() => {});
  }, [sessionKey]);

  const displayTitle =
    meta?.episodeNumber != null
      ? `${meta.title ?? "Untitled"} · Episode ${meta.episodeNumber}`
      : meta?.title ?? "Untitled";

  const progressValue = PHASE_PROGRESS[phase] ?? 10;
  const phaseLabel = PHASE_LABELS[phase] ?? null;

  useEffect(() => {
    let cancelled = false;

    async function resume() {
      try {
        // Step 1: Try resolving the existing session
        const response = await fetch("/api/media-backend/watch-sessions/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionKey }),
        });

        if (cancelled) return;

        const payload = (await response.json()) as ResolveResponse;
        const resolved = payload.ok ? payload.resolution?.session : null;

        if (resolved?.sourceUrl) {
          setPhase("buffering");
          await sleep(600);
          if (cancelled) return;

          setPhase("ready");
          const target = buildWatchTarget(resolved);
          router.prefetch(target);
          await sleep(300);
          if (cancelled) return;

          navigateToWatch(router, target);
          return;
        }

        // Step 2: Session is stale — fall back to auto-resolve
        if (!meta?.title) {
          throw new Error("Session expired and no metadata available to re-resolve.");
        }

        if (cancelled) return;
        setPhase("searching");

        const requestKey = `resume-${sessionKey}-${Date.now()}`;

        const autoResponse = await fetch("/api/media-backend/watch/auto-resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestKey,
            title: meta.title,
            alternateTitles: [],
            episodeNumber: meta.episodeNumber,
            episodeTotal: meta.episodeTotal,
            posterUrl: meta.posterUrl,
          }),
        });

        if (cancelled) return;

        if (!autoResponse.ok) {
          const err = (await autoResponse.json().catch(() => null)) as { error?: string } | null;
          throw new Error(err?.error ?? "Failed to start auto-resolve.");
        }

        // Step 3: Poll auto-resolve status
        while (!cancelled) {
          const status = await pollAutoResolveStatus(requestKey);
          if (cancelled) return;

          if (status) {
            if (status.phase !== "completed" && status.phase !== "failed") {
              setPhase(status.phase);
            }

            if (status.phase === "failed") {
              throw new Error(status.error ?? status.message ?? "Failed to find a source.");
            }

            if (status.phase === "completed" && status.resolution?.session.torrentHash) {
              const session = status.resolution.session;
              setPhase("finalizing");
              const target = buildWatchTarget(session);
              router.prefetch(target);
              await sleep(300);
              if (cancelled) return;

              navigateToWatch(router, target);
              return;
            }
          }

          await sleep(1500);
        }
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
  }, [sessionKey, meta, router]);

  return (
    <main className="fixed inset-0 flex items-center justify-center bg-[#0a0a0a]">
      {meta?.posterUrl ? (
        <img
          src={meta.posterUrl}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          style={{ opacity: 0.06, filter: "blur(40px) saturate(1.2)" }}
        />
      ) : null}

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center px-6">
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

        {phase !== "error" && phaseLabel ? (
          <p className="mt-5 text-[13px] font-medium text-white/60">{phaseLabel}</p>
        ) : null}

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

        <p className="mt-4 max-w-[300px] truncate text-center text-[12px] text-white/25">
          {displayTitle}
        </p>

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
