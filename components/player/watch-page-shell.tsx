"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

const WatchPlayer = dynamic(
  () => import("./watch-player").then((mod) => mod.WatchPlayer),
  {
    ssr: false,
    loading: () => (
      <main className="flex min-h-screen items-center justify-center bg-[#090909] px-6">
        <div className="w-full max-w-md">
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full w-2/3 rounded-full bg-white"
              style={{ animation: "shinobi-player-loading 1.2s ease-in-out infinite" }}
            />
          </div>
          <h1 className="mt-6 text-center text-2xl font-semibold text-white">Loading player</h1>
          <p className="mt-4 text-center text-sm text-white/60">
            Preparing player controls and media overlays.
          </p>
          <style>{`
            @keyframes shinobi-player-loading {
              0% { transform: translateX(-30%); opacity: 0.5; }
              50% { transform: translateX(20%); opacity: 1; }
              100% { transform: translateX(70%); opacity: 0.5; }
            }
          `}</style>
        </div>
      </main>
    ),
  },
);

type SubtitleTrack = {
  index: number;
  label: string;
  src: string;
  language?: string;
  default?: boolean;
  format?: "text" | "pgs" | "ass";
};

type InspectableStream = {
  streamIndex: number;
  kind: "subtitle" | "audio" | "video";
  codecName?: string;
  codecLongName?: string;
  language?: string;
  label?: string;
  pixelFormat?: string;
  profile?: string;
};

type WatchPageShellProps = {
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
  subtitles: SubtitleTrack[];
  demuxRequest?: {
    sourceUrl: string;
    torrentHash: string;
    fileIndex: number;
  };
  restrictForwardSeeksToBuffered?: boolean;
};

type InspectResponse = {
  ok: boolean;
  streams?: InspectableStream[];
  cachedArtifacts?: {
    subtitles: Record<number, string>;
    audio: Record<number, string>;
    fonts?: string[];
  };
  error?: string;
};

type DemuxJobResponse = {
  ok: boolean;
  job: null | {
    id: string;
    status: "queued" | "running" | "completed" | "failed";
    output?: {
      subtitles: string[];
      audio: string[];
    };
    error?: string;
  };
  selectedSubtitle?: {
    label?: string;
    language?: string;
    streamIndex?: number;
  } | null;
  selectedAudio?: {
    label?: string;
    language?: string;
    streamIndex?: number;
  } | null;
  error?: string;
};

type DemuxStatus = {
  state: "idle" | "running" | "completed" | "failed";
  message: string;
};

type WatchSessionResponse = {
  ok: boolean;
  session?: {
    magnetLink?: string;
  };
  error?: string;
};

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

function isPgsSubtitleCodec(codecName?: string): boolean {
  const codec = codecName?.toLowerCase();
  return codec === "hdmv_pgs_subtitle";
}

function isAssSubtitleCodec(codecName?: string): boolean {
  const codec = codecName?.toLowerCase();
  return codec === "ass" || codec === "ssa" || codec === "substation alpha";
}

function formatStreamLabel(stream: InspectableStream): string {
  const parts = [
    stream.label,
    stream.language?.toUpperCase(),
    stream.codecName?.toUpperCase(),
  ].filter(Boolean);

  return parts.join(" / ") || `${stream.kind} ${stream.streamIndex}`;
}

function streamStatus(
  streamIndex: number,
  statuses: Record<number, DemuxStatus>,
): DemuxStatus | null {
  return statuses[streamIndex] ?? null;
}

export function WatchPageShell({
  storageKey,
  sessionKey,
  title,
  streamUrl,
  posterUrl,
  episodeNumber,
  episodeTotal,
  magnetLink,
  torrentHash,
  fileIndex,
  subtitles,
  demuxRequest,
  restrictForwardSeeksToBuffered = true,
}: WatchPageShellProps) {
  const [availableStreams, setAvailableStreams] = useState<InspectableStream[]>([]);
  const [backendSubtitles, setBackendSubtitles] = useState<SubtitleTrack[]>([]);
  const [subtitleStatuses, setSubtitleStatuses] = useState<Record<number, DemuxStatus>>({});
  const [audioStatuses, setAudioStatuses] = useState<Record<number, DemuxStatus>>({});
  const [audioArtifacts, setAudioArtifacts] = useState<Record<number, string>>({});
  const [activeSubtitleLabel, setActiveSubtitleLabel] = useState<string | null>(null);
  const [subtitleLoadingLabel, setSubtitleLoadingLabel] = useState<string | null>(null);
  const [activeAudioTrackId, setActiveAudioTrackId] = useState<number | null>(null);
  const [audioLoadingLabel, setAudioLoadingLabel] = useState<string | null>(null);
  const [audioLoadingMode, setAudioLoadingMode] = useState<"extract" | "transcode" | null>(null);
  const [resolvedMagnetLink, setResolvedMagnetLink] = useState<string | undefined>(magnetLink);

  useEffect(() => {
    sendClientDebug("watch-page-shell", "mount", {
      sessionKey,
      torrentHash,
      fileIndex,
      subtitleCount: subtitles.length,
      hasDemuxRequest: Boolean(demuxRequest),
      hasInitialMagnetLink: Boolean(magnetLink),
    });
  }, [demuxRequest, fileIndex, magnetLink, sessionKey, subtitles.length, torrentHash]);

  const availableSubtitleStreams = useMemo(
    () => availableStreams.filter((stream) => stream.kind === "subtitle"),
    [availableStreams],
  );
  const availableAudioStreams = useMemo(
    () => availableStreams.filter((stream) => stream.kind === "audio"),
    [availableStreams],
  );
  const backendSubtitleOptions = useMemo(
    () =>
      availableSubtitleStreams
        .filter(
          (stream) =>
            !backendSubtitles.some((subtitle) => subtitle.index === 200_000 + stream.streamIndex),
        )
        .map((stream) => {
        const status = streamStatus(stream.streamIndex, subtitleStatuses);
        return {
          id: stream.streamIndex,
          label: formatStreamLabel(stream),
          language: stream.language,
          state: status?.state ?? "idle",
        } as const;
      }),
    [availableSubtitleStreams, backendSubtitles, subtitleStatuses],
  );
  const backendAudioOptions = useMemo(
    () =>
      availableAudioStreams
        .filter((stream) => !audioArtifacts[stream.streamIndex])
        .map((stream) => {
          const status = streamStatus(stream.streamIndex, audioStatuses);
          return {
            id: stream.streamIndex,
            label: formatStreamLabel(stream),
            language: stream.language,
            state: status?.state ?? "idle",
          } as const;
        }),
    [availableAudioStreams, audioArtifacts, audioStatuses],
  );
  const externalAudioTracks = useMemo(
    () =>
      availableAudioStreams
        .filter((stream) => audioArtifacts[stream.streamIndex])
        .map((stream) => ({
          id: stream.streamIndex,
          label: formatStreamLabel(stream),
          src: audioArtifacts[stream.streamIndex] as string,
          language: stream.language,
        })),
    [availableAudioStreams, audioArtifacts],
  );

  useEffect(() => {
    let cancelled = false;

    if (!sessionKey || magnetLink) {
      setResolvedMagnetLink(magnetLink);
      return () => {
        cancelled = true;
      };
    }

    async function loadSession() {
      const resolvedSessionKey = sessionKey!;
      sendClientDebug("watch-page-shell", "load-session-start", {
        sessionKey: resolvedSessionKey,
      });
      const response = await fetch(`/api/media-backend/watch-sessions/${encodeURIComponent(resolvedSessionKey)}`, {
        cache: "no-store",
      });

      const payload = (await response.json()) as WatchSessionResponse;

      if (cancelled || !response.ok || !payload.ok) {
        sendClientDebug("watch-page-shell", "load-session-skip", {
          sessionKey: resolvedSessionKey,
          cancelled,
          responseOk: response.ok,
          payloadOk: payload.ok,
          error: payload.error,
        });
        return;
      }

      sendClientDebug("watch-page-shell", "load-session-success", {
        sessionKey: resolvedSessionKey,
        hasMagnetLink: Boolean(payload.session?.magnetLink),
      });
      setResolvedMagnetLink(payload.session?.magnetLink);
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [magnetLink, sessionKey]);

  useEffect(() => {
    let cancelled = false;

    if (!demuxRequest) {
      return () => {
        cancelled = true;
      };
    }

    const requestConfig = demuxRequest;

    async function loadStreams() {
      const response = await fetch("/api/media-backend/inspect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceUrl: requestConfig.sourceUrl,
          torrentHash: requestConfig.torrentHash,
          fileIndex: requestConfig.fileIndex,
        }),
      });

      const payload = (await response.json()) as InspectResponse;

      if (cancelled) {
        return;
      }

      if (!response.ok || !payload.ok) {
        return;
      }

      setAvailableStreams(payload.streams ?? []);
      setAudioArtifacts(payload.cachedArtifacts?.audio ?? {});
      setBackendSubtitles(
        (payload.streams ?? [])
          .filter(
            (stream) =>
              stream.kind === "subtitle" &&
              Boolean(payload.cachedArtifacts?.subtitles?.[stream.streamIndex]),
          )
          .map((stream) => ({
            index: 200_000 + stream.streamIndex,
            label: formatStreamLabel(stream),
            src: payload.cachedArtifacts?.subtitles?.[stream.streamIndex] as string,
            language: stream.language,
            format: isPgsSubtitleCodec(stream.codecName)
              ? "pgs"
              : isAssSubtitleCodec(stream.codecName)
                ? "ass"
                : "text",
          })),
      );
    }

    void loadStreams();

    return () => {
      cancelled = true;
    };
  }, [demuxRequest]);

  async function startDemux(kind: "subtitle" | "audio", stream: InspectableStream) {
    if (!demuxRequest) {
      return;
    }

    const cachedSubtitle = kind === "subtitle" ? backendSubtitles.find((entry) => entry.index === 200_000 + stream.streamIndex) : null;
    const cachedAudio = kind === "audio" ? audioArtifacts[stream.streamIndex] : null;

    if (cachedSubtitle) {
      setActiveSubtitleLabel(cachedSubtitle.label);
      setSubtitleLoadingLabel(null);
      setSubtitleStatuses((current) => ({
        ...current,
        [stream.streamIndex]: {
          state: "completed",
          message: "Subtitle ready.",
        },
      }));
      return;
    }

    if (cachedAudio) {
      setActiveAudioTrackId(stream.streamIndex);
      setAudioLoadingLabel(null);
      setAudioLoadingMode(null);
      setAudioStatuses((current) => ({
        ...current,
        [stream.streamIndex]: {
          state: "completed",
          message: "Audio ready.",
        },
      }));
      return;
    }

    const setStatus = kind === "subtitle" ? setSubtitleStatuses : setAudioStatuses;
    if (kind === "subtitle") {
      setActiveSubtitleLabel(formatStreamLabel(stream));
      setSubtitleLoadingLabel(formatStreamLabel(stream));
    }
    if (kind === "audio") {
      setActiveAudioTrackId(stream.streamIndex);
      setAudioLoadingLabel(formatStreamLabel(stream));
      setAudioLoadingMode(stream.codecName === "eac3" ? "transcode" : "extract");
    }
    setStatus((current) => ({
      ...current,
      [stream.streamIndex]: {
        state: "running",
        message: `Preparing ${kind}...`,
      },
    }));

    const startResponse = await fetch("/api/media-backend/demux", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...demuxRequest,
        subtitleTrack: kind === "subtitle" ? stream : null,
        audioTrack: kind === "audio" ? stream : null,
      }),
    });

    const startPayload = (await startResponse.json()) as DemuxJobResponse;

    if (!startResponse.ok || !startPayload.ok || !startPayload.job) {
      if (kind === "subtitle") {
        setSubtitleLoadingLabel(null);
      }
      if (kind === "audio") {
        setAudioLoadingLabel(null);
      }
      setStatus((current) => ({
        ...current,
        [stream.streamIndex]: {
          state: "failed",
          message: startPayload.error ?? `Failed to prepare ${kind}.`,
        },
      }));
      return;
    }

    async function poll() {
      const statusResponse = await fetch(`/api/media-backend/demux/${startPayload.job?.id}`, {
        cache: "no-store",
      });
      const statusPayload = (await statusResponse.json()) as {
        ok: boolean;
        job?: {
          status: "queued" | "running" | "completed" | "failed";
          output?: {
            subtitles: string[];
            audio: string[];
            fonts?: string[];
          };
          error?: string;
        };
        error?: string;
      };

      if (!statusResponse.ok || !statusPayload.ok || !statusPayload.job) {
        setStatus((current) => ({
          ...current,
          [stream.streamIndex]: {
            state: "failed",
            message: statusPayload.error ?? `Failed to load ${kind} status.`,
          },
        }));
        return;
      }

      if (statusPayload.job.status === "completed") {
        if (kind === "subtitle") {
          const firstSubtitle = statusPayload.job.output?.subtitles[0];
          if (firstSubtitle) {
            setBackendSubtitles((current) => {
              const next = current.filter((entry) => entry.index !== 200_000 + stream.streamIndex);
              next.push({
                index: 200_000 + stream.streamIndex,
                label: formatStreamLabel(stream),
                src: firstSubtitle,
                language: stream.language,
                format: isPgsSubtitleCodec(stream.codecName)
                  ? "pgs"
                  : isAssSubtitleCodec(stream.codecName)
                    ? "ass"
                    : "text",
              });
              return next;
            });
          }
          setSubtitleLoadingLabel(null);
        }

        if (kind === "audio") {
          const firstAudio = statusPayload.job.output?.audio[0];
          if (firstAudio) {
            setAudioArtifacts((current) => ({
              ...current,
              [stream.streamIndex]: firstAudio,
            }));
          }
          setAudioLoadingLabel(null);
          setAudioLoadingMode(null);
        }

        setStatus((current) => ({
          ...current,
          [stream.streamIndex]: {
            state: "completed",
            message: `${kind === "subtitle" ? "Subtitle" : "Audio"} ready.`,
          },
        }));
        return;
      }

      if (statusPayload.job.status === "failed") {
        if (kind === "subtitle") {
          setSubtitleLoadingLabel(null);
        }
        if (kind === "audio") {
          setAudioLoadingLabel(null);
          setAudioLoadingMode(null);
        }
        setStatus((current) => ({
          ...current,
          [stream.streamIndex]: {
            state: "failed",
            message: statusPayload.job?.error ?? `Failed to prepare ${kind}.`,
          },
        }));
        return;
      }

      setStatus((current) => ({
        ...current,
        [stream.streamIndex]: {
          state: "running",
          message: `${kind === "subtitle" ? "Subtitle" : "Audio"} ${statusPayload.job?.status ?? "running"}...`,
        },
      }));
      window.setTimeout(poll, 1500);
    }

    void poll();
  }

  function handleExtractSubtitle(streamIndex: number) {
    const stream = availableSubtitleStreams.find((entry) => entry.streamIndex === streamIndex);
    if (!stream) {
      return;
    }
    void startDemux("subtitle", stream);
  }

  function handleDisableSubtitle() {
    setActiveSubtitleLabel(null);
    setSubtitleLoadingLabel(null);
  }

  function handleExtractAudio(streamIndex: number) {
    if (audioArtifacts[streamIndex]) {
      setActiveAudioTrackId(streamIndex);
      return;
    }

    const stream = availableAudioStreams.find((entry) => entry.streamIndex === streamIndex);
    if (!stream) {
      return;
    }
    void startDemux("audio", stream);
  }

  return (
    <>
      <WatchPlayer
        storageKey={storageKey}
        sessionKey={sessionKey}
        title={title}
        streamUrl={streamUrl}
        posterUrl={posterUrl}
        episodeNumber={episodeNumber}
        episodeTotal={episodeTotal}
        magnetLink={resolvedMagnetLink}
        torrentHash={torrentHash}
        fileIndex={fileIndex}
        subtitles={[...subtitles, ...backendSubtitles]}
        backendSubtitleOptions={backendSubtitleOptions}
        backendAudioOptions={backendAudioOptions}
        onExtractSubtitle={handleExtractSubtitle}
        onDisableSubtitle={handleDisableSubtitle}
        onExtractAudio={handleExtractAudio}
        preferredSubtitleLabel={activeSubtitleLabel}
        subtitleLoadingLabel={subtitleLoadingLabel}
        externalAudioTracks={externalAudioTracks}
        selectedExternalAudioId={activeAudioTrackId}
        onSelectExternalAudio={setActiveAudioTrackId}
        audioLoadingLabel={audioLoadingLabel}
        audioLoadingMode={audioLoadingMode}
        restrictForwardSeeksToBuffered={restrictForwardSeeksToBuffered}
      />
    </>
  );
}
