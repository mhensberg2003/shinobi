import { NextResponse } from "next/server";

import { getMediaBackendConfig } from "@/lib/media-backend/config";
import { inspectMediaSource } from "@/lib/media-backend/client";

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
    };

    if (!body.sourceUrl) {
      return NextResponse.json(
        { ok: false, error: "sourceUrl is required." },
        { status: 400 },
      );
    }

    const streams = await inspectMediaSource(body.sourceUrl);

    return NextResponse.json({
      ok: true,
      streams,
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
