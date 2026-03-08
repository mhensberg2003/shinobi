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
  posterUrl?: string;
  year?: number;
  episodeHint?: string;
  episodeNumber?: number;
  episodeTotal?: number;
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

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function getStateHistory(status: BackendAutoResolveStatus | null) {
  const items: string[] = [];

  if (status?.phase) {
    items.push(status.message);
  }

  if (status?.candidate?.title) {
    items.push(`Candidate: ${status.candidate.title}`);
  }

  return items.slice(0, 3);
}

export function AutoResolveProgress({
  requestKey,
  title,
  alternateTitles,
  provider,
  mediaId,
  kind,
  posterUrl,
  year,
  episodeHint,
  episodeNumber,
  episodeTotal,
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
            posterUrl,
            episodeNumber,
            episodeTotal,
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

  const titleLabel =
    error ? "Could not open your stream" : "Preparing your stream";

  const statusLabel =
    error
      ? error
      : backendStatus?.message ?? "Contacting the resolver";

  const history = getStateHistory(backendStatus);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#090909] px-6">
      <div className="w-full max-w-md">
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ${
              error ? "bg-rose-300" : "bg-white"
            }`}
            style={{ width: `${progressValue}%` }}
          />
        </div>

        <div className="mt-5 flex items-center justify-between text-[11px] uppercase tracking-[0.24em] text-white/35">
          <span>{formatElapsed(elapsedMs)}</span>
          <span>{progressValue}%</span>
        </div>

        <h1 className="mt-6 text-center text-2xl font-semibold text-white">{titleLabel}</h1>
        <p className="mt-4 text-center text-sm text-white/60">{statusLabel}</p>

        {history.length > 0 && !error ? (
          <div className="mt-5 space-y-2">
            {history.map((item) => (
              <p key={item} className="text-center text-xs text-white/35">
                {item}
              </p>
            ))}
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-full border border-white/14 bg-white/7 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/12"
            >
              Go back
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
