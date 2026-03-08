import { NextResponse } from "next/server";

import { getAutoResolveStatus } from "@/lib/media-backend/client";
import { getMediaBackendConfig } from "@/lib/media-backend/config";

export async function GET(request: Request) {
  if (!getMediaBackendConfig()) {
    return NextResponse.json(
      { ok: false, error: "Media backend is not configured." },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const requestKey = searchParams.get("requestKey")?.trim();

  if (!requestKey) {
    return NextResponse.json({ ok: false, error: "requestKey is required." }, { status: 400 });
  }

  try {
    const status = await getAutoResolveStatus(requestKey);
    console.info("[shinobi:auto-resolve-status-proxy] success", {
      requestKey,
      phase: status.phase,
      message: status.message,
      torrentHash: status.torrentHash,
      fileIndex: status.fileIndex,
      hasResolution: Boolean(status.resolution),
      error: status.error,
    });
    return NextResponse.json({ ok: true, status });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to read auto-resolve status.";

    console.info("[shinobi:auto-resolve-status-proxy] error", {
      requestKey,
      message,
    });

    if (/request not found/i.test(message) || /\b404\b/.test(message)) {
      return NextResponse.json({ ok: false, error: "Auto-resolve request not found." }, { status: 404 });
    }

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
