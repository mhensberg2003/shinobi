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

export function ResumeWatchProgress({
  session,
}: ResumeWatchProgressProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function resolveAndRedirect() {
      try {
        const response = await fetch("/api/media-backend/watch-sessions/resolve", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionKey: session.sessionKey,
          }),
        });

        const payload = (await response.json()) as ResolveResponse;

        if (cancelled) {
          return;
        }

        if (!response.ok || !payload.ok || !payload.resolution?.session) {
          throw new Error(payload.error ?? "Failed to resolve watch session.");
        }

        const activeSession = payload.resolution.session;
        if (!activeSession.sourceUrl || !activeSession.torrentHash) {
          window.setTimeout(() => {
            if (!cancelled) {
              void resolveAndRedirect();
            }
          }, 3_000);
          return;
        }

        const query = new URLSearchParams({
          file: String(activeSession.fileIndex),
          session: activeSession.sessionKey,
        });

        if (activeSession.title) {
          query.set("title", activeSession.title);
        }
        if (activeSession.posterUrl) {
          query.set("poster", activeSession.posterUrl);
        }
        if (activeSession.episodeNumber != null) {
          query.set("ep", String(activeSession.episodeNumber));
        }
        if (activeSession.episodeTotal != null) {
          query.set("eps", String(activeSession.episodeTotal));
        }

        router.replace(`/watch/${activeSession.torrentHash}?${query.toString()}`);
      } catch (resolveError) {
        if (!cancelled) {
          setError(
            resolveError instanceof Error ? resolveError.message : "Failed to prepare playback.",
          );
        }
      }
    }

    void resolveAndRedirect();

    return () => {
      cancelled = true;
    };
  }, [router, session]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000",
        color: "#fff",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 460, textAlign: "center" }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>
          {error ? "Could not open your stream" : "Preparing your stream"}
        </h1>
        <p style={{ margin: "12px 0 0", color: "rgba(255,255,255,0.72)", lineHeight: 1.5 }}>
          {error
            ? error
            : "The playback source is still being prepared. This page will retry automatically."}
        </p>
      </div>
    </main>
  );
}
