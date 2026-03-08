import { NextResponse } from "next/server";

import { getMediaBackendConfig } from "@/lib/media-backend/config";
import { inspectMediaSource } from "@/lib/media-backend/client";

function toArtifactProxyUrl(url: string): string {
  const token = Buffer.from(url).toString("base64url");
  return `/api/media-backend/artifact?url=${encodeURIComponent(token)}`;
}

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
    };

    if (!body.sourceUrl) {
      return NextResponse.json(
        { ok: false, error: "sourceUrl is required." },
        { status: 400 },
      );
    }

    const result = await inspectMediaSource({
      sourceUrl: body.sourceUrl,
      torrentHash: body.torrentHash,
      fileIndex: body.fileIndex,
    });

    return NextResponse.json({
      ok: true,
      streams: result.streams,
      cachedArtifacts: {
        subtitles: Object.fromEntries(
          Object.entries(result.cachedArtifacts.subtitles).map(([streamIndex, url]) => [
            streamIndex,
            toArtifactProxyUrl(url),
          ]),
        ),
        audio: Object.fromEntries(
          Object.entries(result.cachedArtifacts.audio).map(([streamIndex, url]) => [
            streamIndex,
            toArtifactProxyUrl(url),
          ]),
        ),
      },
      playback: result.playback,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to inspect media source.",
      },
      { status: 500 },
    );
  }
}
