import { NextResponse } from "next/server";

import { getSeedboxConfig } from "@/lib/seedbox/config";
import { getTorrentDetails, selectOnlyTorrentFile } from "@/lib/seedbox/rtorrent";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!getSeedboxConfig()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Missing seedbox configuration. Populate SEEDBOX_RPC_URL, SEEDBOX_RPC_USER, and SEEDBOX_RPC_PASSWORD.",
      },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as {
      hash?: string;
      fileIndex?: number;
    };

    const hash = body.hash?.trim();
    const fileIndex = Number(body.fileIndex);

    if (!hash || !Number.isInteger(fileIndex) || fileIndex < 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "A valid torrent hash and file index are required.",
        },
        { status: 400 },
      );
    }

    await selectOnlyTorrentFile(hash, fileIndex);
    const details = await getTorrentDetails(hash);

    return NextResponse.json({
      ok: true,
      details,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to update file priorities.",
      },
      { status: 500 },
    );
  }
}
