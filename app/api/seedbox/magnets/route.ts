import { NextResponse } from "next/server";

import { getSeedboxConfig } from "@/lib/seedbox/config";
import { addMagnetLink, getSeedboxSnapshot, getTorrentHashes } from "@/lib/seedbox/rtorrent";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const config = getSeedboxConfig();

  if (!config) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Missing seedbox configuration. Populate SEEDBOX_RPC_URL, SEEDBOX_RPC_USER, and SEEDBOX_RPC_PASSWORD.",
      },
      { status: 503 },
    );
  }

  let magnetLink = "";

  try {
    const body = (await request.json()) as { magnetLink?: string };
    magnetLink = body.magnetLink?.trim() ?? "";
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Request body must be valid JSON.",
      },
      { status: 400 },
    );
  }

  if (!magnetLink.startsWith("magnet:?")) {
    return NextResponse.json(
      {
        ok: false,
        error: "Provide a valid magnet link.",
      },
      { status: 400 },
    );
  }

  try {
    const beforeHashes = await getTorrentHashes();
    await addMagnetLink(magnetLink);
    let addedHash: string | null = null;

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const currentHashes = await getTorrentHashes();
      addedHash = currentHashes.find((hash) => !beforeHashes.includes(hash)) ?? null;

      if (addedHash) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    const snapshot = await getSeedboxSnapshot();

    return NextResponse.json({
      ok: true,
      addedHash,
      snapshot,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to add magnet link.",
      },
      { status: 500 },
    );
  }
}
