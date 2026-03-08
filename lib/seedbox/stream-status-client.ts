export type StreamPreparationStatus = {
  hash: string;
  fileIndex: number;
  ready: boolean;
  progress: number;
  downloadedBytes: number;
  requiredBytes: number;
  message: string;
};

type StreamStatusResponse = {
  ok: boolean;
  status?: StreamPreparationStatus;
  error?: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function waitForStreamReadiness({
  hash,
  fileIndex,
  onUpdate,
  pollMs = 1500,
  timeoutMs = 180000,
  maxTransientFailures = 5,
}: {
  hash: string;
  fileIndex: number;
  onUpdate?: (status: StreamPreparationStatus) => void;
  pollMs?: number;
  timeoutMs?: number;
  maxTransientFailures?: number;
}): Promise<StreamPreparationStatus> {
  const startedAt = Date.now();
  let transientFailures = 0;

  for (;;) {
    try {
      const response = await fetch(`/api/seedbox/stream-status?hash=${encodeURIComponent(hash)}&fileIndex=${fileIndex}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as StreamStatusResponse;

      if (!response.ok || !payload.ok || !payload.status) {
        throw new Error(payload.error ?? "Failed to inspect stream readiness.");
      }

      transientFailures = 0;
      onUpdate?.(payload.status);

      if (payload.status.ready) {
        return payload.status;
      }
    } catch (error) {
      transientFailures += 1;
      if (transientFailures > maxTransientFailures) {
        throw error instanceof Error
          ? error
          : new Error("Failed to inspect stream readiness.");
      }
    }

    if (Date.now() - startedAt >= timeoutMs) {
      throw new Error("Timed out while preparing the stream.");
    }

    await sleep(pollMs);
  }
}
