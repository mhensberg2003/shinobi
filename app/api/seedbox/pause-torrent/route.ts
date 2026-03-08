import { NextResponse } from "next/server";

import { getSeedboxConfig } from "@/lib/seedbox/config";
import { getTorrentDetails, stopTorrentAndClearSelection } from "@/lib/seedbox/client";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!getSeedboxConfig()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Missing seedbox configuration. Populate SEEDBOX_API_URL, SEEDBOX_API_USER, and SEEDBOX_API_PASSWORD.",
      },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as { hash?: string };
    const hash = body.hash?.trim();

    if (!hash) {
      return NextResponse.json(
        { ok: false, error: "A valid torrent hash is required." },
        { status: 400 },
      );
    }

    const details = await getTorrentDetails(hash);
    if (!details.files.length) {
      return NextResponse.json(
        { ok: false, error: "Torrent metadata is not ready yet." },
        { status: 409 },
      );
    }

    await stopTorrentAndClearSelection(hash);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to pause torrent.",
      },
      { status: 500 },
    );
  }
}
