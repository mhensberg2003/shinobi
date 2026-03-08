import { NextResponse } from "next/server";

import { getMediaBackendConfig } from "@/lib/media-backend/config";
import { resolveWatchSession } from "@/lib/media-backend/client";

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
    };

    if (!body.sessionKey) {
      return NextResponse.json(
        { ok: false, error: "sessionKey is required." },
        { status: 400 },
      );
    }

    const resolution = await resolveWatchSession(body.sessionKey);
    return NextResponse.json({ ok: true, resolution });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to resolve watch session.",
      },
      { status: 500 },
    );
  }
}
