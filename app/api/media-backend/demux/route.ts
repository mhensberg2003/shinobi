import { NextResponse } from "next/server";

import { createDemuxJob, inspectMediaSource } from "@/lib/media-backend/client";
import { getMediaBackendConfig } from "@/lib/media-backend/config";

export async function POST(request: Request) {
  if (!getMediaBackendConfig()) {
    return NextResponse.json(
      { ok: false, error: "Media backend is not configured." },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as {
      sourceUrl?: string;
      torrentHash?: string;
      fileIndex?: number;
      subtitleTrack?: {
        streamIndex?: number;
        codec?: string;
        language?: string;
        label?: string;
      } | null;
      audioTrack?: {
        streamIndex?: number;
        codec?: string;
        language?: string;
        label?: string;
      } | null;
    };

    const fileIndex = Number(body.fileIndex);

    if (!body.sourceUrl || !body.torrentHash || !Number.isInteger(fileIndex)) {
      return NextResponse.json(
        { ok: false, error: "sourceUrl, torrentHash, and fileIndex are required." },
        { status: 400 },
      );
    }

    const streams = await inspectMediaSource(body.sourceUrl);
    const subtitleStream =
      body.subtitleTrack && Number.isInteger(body.subtitleTrack.streamIndex)
        ? streams.find(
            (stream) =>
              stream.kind === "subtitle" &&
              stream.streamIndex === body.subtitleTrack?.streamIndex,
          ) ?? null
        : null;
    const audioStream =
      body.audioTrack && Number.isInteger(body.audioTrack.streamIndex)
        ? streams.find(
            (stream) =>
              stream.kind === "audio" &&
              stream.streamIndex === body.audioTrack?.streamIndex,
          ) ?? null
        : null;

    if (!subtitleStream && !audioStream) {
      return NextResponse.json({
        ok: true,
        job: null,
        streams,
        selectedSubtitle: null,
        selectedAudio: null,
      });
    }

    const job = await createDemuxJob({
      sourceUrl: body.sourceUrl,
      torrentHash: body.torrentHash,
      fileIndex,
      subtitleTracks: subtitleStream
        ? [
            {
              streamIndex: subtitleStream.streamIndex,
              codec: subtitleStream.codecName,
              language: subtitleStream.language,
              label: subtitleStream.label,
            },
          ]
        : [],
      audioTracks: audioStream
        ? [
            {
              streamIndex: audioStream.streamIndex,
              codec: audioStream.codecName,
              language: audioStream.language,
              label: audioStream.label,
            },
          ]
        : [],
    });

    return NextResponse.json({
      ok: true,
      job,
      streams,
      selectedSubtitle: subtitleStream,
      selectedAudio: audioStream,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to create media backend job.",
      },
      { status: 500 },
    );
  }
}
