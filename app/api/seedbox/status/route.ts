import { NextResponse } from "next/server";

import { getSeedboxConfig } from "@/lib/seedbox/config";
import { getSeedboxSnapshot } from "@/lib/seedbox/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = getSeedboxConfig();

  if (!config) {
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
