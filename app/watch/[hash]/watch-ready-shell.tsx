"use client";

import { useEffect, useState } from "react";

import { WatchPageShell as InnerWatchPageShell } from "@/components/player/watch-page-shell";
import {
  type StreamPreparationStatus,
  waitForStreamReadiness,
} from "@/lib/seedbox/stream-status-client";

type WatchReadyShellProps = React.ComponentProps<typeof InnerWatchPageShell> & {
  torrentHash: string;
  fileIndex: number;
  requiresStreamPreparation?: boolean;
};

function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function WatchReadyShell(props: WatchReadyShellProps) {
  const { torrentHash, fileIndex, requiresStreamPreparation = true } = props;
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<StreamPreparationStatus | null>(null);

  useEffect(() => {
    if (!requiresStreamPreparation) {
      setReady(true);
      setError(null);
      setStatus(null);
      return;
    }

    let cancelled = false;

    setReady(false);
    setError(null);
    setStatus(null);

    void waitForStreamReadiness({
      hash: torrentHash,
      fileIndex,
      onUpdate(nextStatus) {
        if (!cancelled) {
          setStatus(nextStatus);
        }
      },
    })
      .then(() => {
        if (!cancelled) {
          setReady(true);
        }
      })
      .catch((readinessError) => {
        if (!cancelled) {
          setError(
            readinessError instanceof Error
              ? readinessError.message
              : "Timed out while preparing the stream.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fileIndex, requiresStreamPreparation, torrentHash]);

  if (ready) {
    return <InnerWatchPageShell {...props} />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#090909] px-6">
      <div className="w-full max-w-md">
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-white transition-[width] duration-500"
            style={{ width: `${status?.progress ?? 12}%` }}
          />
        </div>
        <h1 className="mt-6 text-center text-2xl font-semibold text-white">
          {error ? "Could not open player" : "Preparing stream"}
        </h1>
        <p className="mt-4 text-center text-sm text-white/60">
          {error ?? status?.message ?? "Waiting for the stream to become readable."}
        </p>
        {status ? (
          <p className="mt-3 text-center text-xs text-white/45">
            {formatBytes(status.downloadedBytes)} / {formatBytes(status.requiredBytes)}
          </p>
        ) : null}
      </div>
    </main>
  );
}
