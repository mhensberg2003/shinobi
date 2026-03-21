"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import type { BackendAutoResolveStatus } from "@/lib/media-backend/types";

type AutoResolveProgressProps = {
  requestKey: string;
  title: string;
  alternateTitles: string[];
  provider?: "anilist" | "tmdb";
  mediaId?: string;
  kind?: "anime" | "movie" | "show";
  anilistId?: string;
  posterUrl?: string;
  year?: number;
  episodeHint?: string;
  episodeNumber?: number;
  episodeTotal?: number;
  season?: number;
};

type TorrentDetailsResponse = {
  ok: boolean;
  details?: {
    files: Array<{
      index: number;
      streamUrl?: string;
    }>;
  };
  error?: string;
};

type AutoResolveStatusResponse = {
  ok: boolean;
  status?: BackendAutoResolveStatus;
  error?: string;
};

const PHASE_PROGRESS: Record<BackendAutoResolveStatus["phase"], number> = {
  queued: 6,
  searching: 18,
  ranking: 30,
  "trying-candidate": 44,
  "fetching-metadata": 56,
  "picking-file": 66,
  "selecting-file": 74,
  "waiting-for-playable": 79,
  buffering: 84,
  probing: 92,
  finalizing: 97,
  completed: 100,
  failed: 100,
};

const PHASE_LABELS: Partial<Record<BackendAutoResolveStatus["phase"], string>> = {
  queued: "Starting up",
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
};

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
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

async function pollAutoResolveStatus(requestKey: string): Promise<BackendAutoResolveStatus | null> {
  const response = await fetch(
    `/api/media-backend/watch/auto-resolve/status?requestKey=${encodeURIComponent(requestKey)}`,
    { cache: "no-store" },
  );

  if (response.status === 404) {
    return null;
  }

  const payload = (await response.json()) as AutoResolveStatusResponse;

  if (!response.ok || !payload.ok) {
    throw new Error(payload.error ?? "Failed to read auto-resolve status.");
  }

  return payload.status ?? null;
}

export function AutoResolveProgress({
  requestKey,
  title,
  alternateTitles,
  provider,
  mediaId,
  kind,
  anilistId,
  posterUrl,
  year,
  episodeHint,
  episodeNumber,
  episodeTotal,
  season,
}: AutoResolveProgressProps) {
  const router = useRouter();
  const [startedAt] = useState(() => Date.now());
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<BackendAutoResolveStatus | null>(null);
  const startedRef = useRef(false);
  const completedRef = useRef(false);
  const prefetchedTargetRef = useRef<string | null>(null);
  const lastPhaseRef = useRef<string | null>(null);

  function buildWatchTarget(
    torrentHash: string,
    fileIndex: number,
    sessionKey: string,
  ): string {
    const params = new URLSearchParams({
      file: String(fileIndex),
      session: sessionKey,
    });

    if (posterUrl) {
      params.set("poster", posterUrl);
    }
    if (episodeHint) {
      params.set("title", episodeHint);
    }
    if (episodeNumber != null) {
      params.set("ep", String(episodeNumber));
    }
    if (episodeTotal != null) {
      params.set("eps", String(episodeTotal));
    }

    return `/watch/${torrentHash}?${params.toString()}`;
  }

  useEffect(() => {
    const interval = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 250);

    return () => window.clearInterval(interval);
  }, [startedAt]);

  useEffect(() => {
    let cancelled = false;

    async function startResolve() {
      if (startedRef.current) {
        return;
      }

      startedRef.current = true;

      try {
        sendClientDebug("auto-resolve-progress", "start-resolve", {
          requestKey,
          title,
          provider,
          mediaId,
          kind,
          episodeNumber,
        });
        const response = await fetch("/api/media-backend/watch/auto-resolve", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requestKey,
            title,
            alternateTitles,
            provider,
            mediaId,
            kind,
            anilistId,
            posterUrl,
            episodeNumber,
            episodeTotal,
            season,
            year,
          }),
        });

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { ok?: boolean; error?: string }
            | null;
          throw new Error(payload?.error ?? "Could not automatically resolve a torrent.");
        }
      } catch (resolveError) {
        if (!cancelled) {
          sendClientDebug("auto-resolve-progress", "start-resolve-error", {
            requestKey,
            error: resolveError instanceof Error ? resolveError.message : "unknown",
          });
          setError(
            resolveError instanceof Error ? resolveError.message : "Failed to prepare playback.",
          );
        }
      }
    }

    void startResolve();

    return () => {
      cancelled = true;
    };
  }, [
    alternateTitles,
    episodeNumber,
    episodeTotal,
    kind,
    mediaId,
    posterUrl,
    provider,
    requestKey,
    title,
    year,
  ]);

  useEffect(() => {
    const session = backendStatus?.resolution?.session;
    const torrentHash = session?.torrentHash;

    if (!session || !torrentHash) {
      return;
    }

    const target = buildWatchTarget(torrentHash, session.fileIndex, session.sessionKey);
    if (prefetchedTargetRef.current === target) {
      return;
    }

    prefetchedTargetRef.current = target;
    sendClientDebug("auto-resolve-progress", "prefetch-watch-target", {
      requestKey,
      target,
      torrentHash,
      fileIndex: session.fileIndex,
      sessionKey: session.sessionKey,
    });
    void router.prefetch(target);
  }, [backendStatus, episodeHint, episodeNumber, episodeTotal, posterUrl, router]);

  useEffect(() => {
    let cancelled = false;

    async function watchResolveStatus() {
      while (!cancelled && !completedRef.current && !error) {
        try {
          const status = await pollAutoResolveStatus(requestKey);

          if (cancelled) {
            return;
          }

          if (status) {
            if (lastPhaseRef.current !== status.phase) {
              lastPhaseRef.current = status.phase;
              sendClientDebug("auto-resolve-progress", "phase-update", {
                requestKey,
                phase: status.phase,
                message: status.message,
                torrentHash: status.torrentHash,
                fileIndex: status.fileIndex,
                candidate: status.candidate?.title,
              });
            }

            setBackendStatus(status);

            if (status.phase === "failed") {
              sendClientDebug("auto-resolve-progress", "phase-failed", {
                requestKey,
                error: status.error ?? status.message,
              });
              setError(status.error ?? status.message ?? "Failed to prepare playback.");
              return;
            }

            if (status.phase === "completed" && status.resolution?.session.torrentHash) {
              const session = status.resolution.session;
              const torrentHash = status.resolution.session.torrentHash;
              const target = buildWatchTarget(torrentHash, session.fileIndex, session.sessionKey);
              completedRef.current = true;

              setBackendStatus({
                ...status,
                phase: "finalizing",
                message: "Opening the player",
              });

              sendClientDebug("auto-resolve-progress", "router-replace-watch-target", {
                requestKey,
                target,
                torrentHash,
                fileIndex: session.fileIndex,
                sessionKey: session.sessionKey,
              });
              router.replace(target);
              window.setTimeout(() => {
                const targetPathname = new URL(target, window.location.origin).pathname;
                if (window.location.pathname !== targetPathname) {
                  sendClientDebug("auto-resolve-progress", "router-replace-fallback-assign", {
                    requestKey,
                    target,
                  });
                  window.location.assign(target);
                }
              }, 3000);
              return;
            }
          }
        } catch (statusError) {
          if (!cancelled && !completedRef.current) {
            sendClientDebug("auto-resolve-progress", "status-poll-error", {
              requestKey,
              error: statusError instanceof Error ? statusError.message : "unknown",
            });
            setError(
              statusError instanceof Error
                ? statusError.message
                : "Failed to read playback preparation status.",
            );
            return;
          }
        }

        await sleep(1500);
      }
    }

    void watchResolveStatus();

    return () => {
      cancelled = true;
    };
  }, [episodeHint, episodeNumber, episodeTotal, error, posterUrl, requestKey, router]);

  const progressValue = useMemo(() => {
    if (error) {
      return 100;
    }

    if (backendStatus) {
      return PHASE_PROGRESS[backendStatus.phase];
    }

    return Math.min(14, 4 + Math.round((1 - Math.exp(-elapsedMs / 6000)) * 10));
  }, [backendStatus, elapsedMs, error]);

  const phaseLabel = backendStatus?.phase
    ? PHASE_LABELS[backendStatus.phase] ?? null
    : null;

  const displayTitle = episodeNumber != null
    ? `${title} \u00b7 Episode ${episodeNumber}`
    : title;

  return (
    <main className="fixed inset-0 flex items-center justify-center bg-[#0a0a0a]">
      {posterUrl ? (
        <img
          src={posterUrl}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          style={{ opacity: 0.06, filter: "blur(40px) saturate(1.2)" }}
        />
      ) : null}

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center px-6">
        {/* Progress bar */}
        {!error ? (
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
        {!error && phaseLabel ? (
          <p className="mt-5 text-[13px] font-medium text-white/60">{phaseLabel}</p>
        ) : !error ? (
          <div className="mt-5 h-5 w-5 animate-spin rounded-full border-[2px] border-white/10 border-t-white/50" />
        ) : null}

        {/* Error state */}
        {error ? (
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
        {error ? (
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
