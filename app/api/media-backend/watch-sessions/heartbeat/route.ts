import { NextResponse } from "next/server";

import { heartbeatWatchSession } from "@/lib/media-backend/client";
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
      sessionKey?: string;
      magnetLink?: string;
      fileIndex?: number;
      torrentHash?: string;
      title?: string;
      posterUrl?: string;
      episodeNumber?: number;
      episodeTotal?: number;
      progressSeconds?: number;
      durationSeconds?: number;
    };
    const fileIndex = Number(body.fileIndex);

    if (!body.sessionKey || !body.magnetLink || !Number.isInteger(fileIndex)) {
      return NextResponse.json(
        { ok: false, error: "sessionKey, magnetLink, and fileIndex are required." },
        { status: 400 },
      );
    }

    const session = await heartbeatWatchSession({
      sessionKey: body.sessionKey,
      magnetLink: body.magnetLink,
      fileIndex,
      torrentHash: body.torrentHash,
      title: body.title,
      posterUrl: body.posterUrl,
      episodeNumber: body.episodeNumber,
      episodeTotal: body.episodeTotal,
      progressSeconds: body.progressSeconds,
      durationSeconds: body.durationSeconds,
    });

    return NextResponse.json({ ok: true, session });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to heartbeat watch session.",
      },
      { status: 500 },
    );
  }
}
