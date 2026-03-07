"use client";

import { useEffect, useMemo, useState } from "react";

import { WatchPlayer } from "./watch-player";

type SubtitleTrack = {
  index: number;
  label: string;
  src: string;
  language?: string;
  default?: boolean;
};

type InspectableStream = {
  streamIndex: number;
  kind: "subtitle" | "audio";
  codecName?: string;
  codecLongName?: string;
  language?: string;
  label?: string;
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
};

type InspectResponse = {
  ok: boolean;
  streams?: InspectableStream[];
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
      availableSubtitleStreams.map((stream) => {
        const status = streamStatus(stream.streamIndex, subtitleStatuses);
        return {
          id: stream.streamIndex,
          label: formatStreamLabel(stream),
          language: stream.language,
          state: status?.state ?? "idle",
        } as const;
      }),
    [availableSubtitleStreams, subtitleStatuses],
  );
  const backendAudioOptions = useMemo(
    () =>
      availableAudioStreams.map((stream) => {
        const status = streamStatus(stream.streamIndex, audioStatuses);
        return {
          id: stream.streamIndex,
          label: formatStreamLabel(stream),
          language: stream.language,
          state: status?.state ?? "idle",
        } as const;
      }),
    [availableAudioStreams, audioStatuses],
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

    async function loadStreams() {
      if (!demuxRequest) {
        return;
      }

      const response = await fetch("/api/media-backend/inspect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceUrl: demuxRequest.sourceUrl,
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

    const setStatus = kind === "subtitle" ? setSubtitleStatuses : setAudioStatuses;
    if (kind === "subtitle") {
      setActiveSubtitleLabel(formatStreamLabel(stream));
      setSubtitleLoadingLabel(formatStreamLabel(stream));
    }
    if (kind === "audio") {
      setActiveAudioTrackId(stream.streamIndex);
      setAudioLoadingLabel(formatStreamLabel(stream));
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
        magnetLink={magnetLink}
        torrentHash={torrentHash}
        fileIndex={fileIndex}
        subtitles={[...subtitles, ...backendSubtitles]}
        backendSubtitleOptions={backendSubtitleOptions}
        backendAudioOptions={backendAudioOptions}
        onExtractSubtitle={handleExtractSubtitle}
        onExtractAudio={handleExtractAudio}
        preferredSubtitleLabel={activeSubtitleLabel}
        subtitleLoadingLabel={subtitleLoadingLabel}
        externalAudioTracks={externalAudioTracks}
        selectedExternalAudioId={activeAudioTrackId}
        onSelectExternalAudio={setActiveAudioTrackId}
        audioLoadingLabel={audioLoadingLabel}
      />
    </>
  );
}
