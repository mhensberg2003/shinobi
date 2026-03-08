"use client";

import { waitForStreamReadiness, type StreamPreparationStatus } from "@/lib/seedbox/stream-status-client";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

export function SelectAndWatchButton({
  hash,
  fileIndex,
  magnetLink,
  title,
  posterUrl,
  episodeNumber,
  episodeTotal,
}: {
  hash: string;
  fileIndex: number;
  magnetLink: string;
  title: string;
  posterUrl?: string;
  episodeNumber?: number;
  episodeTotal?: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preparingStatus, setPreparingStatus] = useState<StreamPreparationStatus | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);

    try {
      const sessionKey = crypto.randomUUID();
      const response = await fetch("/api/seedbox/select-file", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hash,
          fileIndex,
        }),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Failed to select file.");
      }

      setPreparingStatus({
        hash,
        fileIndex,
        ready: false,
        progress: 0,
        downloadedBytes: 0,
        requiredBytes: 1,
        message: "Starting download...",
      });

      await waitForStreamReadiness({
        hash,
        fileIndex,
        onUpdate: setPreparingStatus,
      });

      await fetch("/api/media-backend/watch-sessions/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionKey,
          magnetLink,
          fileIndex,
          torrentHash: hash,
          title,
          posterUrl,
          episodeNumber,
          episodeTotal,
          progressSeconds: 0,
          durationSeconds: 0,
        }),
      });

      startTransition(() => {
        const params = new URLSearchParams({
          file: String(fileIndex),
          session: sessionKey,
          title,
        });

        if (posterUrl) {
          params.set("poster", posterUrl);
        }
        if (episodeNumber != null) {
          params.set("ep", String(episodeNumber));
        }
        if (episodeTotal != null) {
          params.set("eps", String(episodeTotal));
        }

        router.push(`/watch/${hash}?${params.toString()}`);
      });
    } catch (selectionError) {
      setError(selectionError instanceof Error ? selectionError.message : "Failed to select file.");
    } finally {
      setPending(false);
    }
  }

  const preparingPct = preparingStatus
    ? Math.max(
        preparingStatus.progress,
        preparingStatus.requiredBytes > 0
          ? Math.min(99, Math.round((preparingStatus.downloadedBytes / preparingStatus.requiredBytes) * 100))
          : preparingStatus.progress,
      )
    : 0;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded-full border border-sky-200/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/16 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Preparing stream..." : "Play this file"}
      </button>
      {pending && preparingStatus ? (
        <>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-sky-300 transition-[width] duration-300"
              style={{ width: `${preparingPct}%` }}
            />
          </div>
          <p className="text-xs text-[var(--muted)]">
            {preparingStatus.message} {preparingPct}%
          </p>
        </>
      ) : null}
      {error ? <p className="text-xs text-rose-200">{error}</p> : null}
    </div>
  );
}
