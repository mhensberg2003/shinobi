import { NextResponse } from "next/server";

import { getSeedboxConfig } from "@/lib/seedbox/config";
import { getSeedboxSnapshot } from "@/lib/seedbox/rtorrent";

export const dynamic = "force-dynamic";

export async function GET() {
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

  try {
    const snapshot = await getSeedboxSnapshot();

    return NextResponse.json({
      ok: true,
      snapshot,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown seedbox error.",
      },
      { status: 500 },
    );
  }
}
