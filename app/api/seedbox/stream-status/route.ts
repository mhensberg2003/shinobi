import { type NextRequest, NextResponse } from "next/server";

import { getSeedboxConfig } from "@/lib/seedbox/config";
import { getStreamPreparationStatus } from "@/lib/seedbox/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!getSeedboxConfig()) {
    return NextResponse.json({ ok: false, error: "Seedbox not configured." }, { status: 503 });
  }

  const hash = req.nextUrl.searchParams.get("hash")?.trim();
  const fileIndex = Number(req.nextUrl.searchParams.get("fileIndex"));

  if (!hash || !Number.isInteger(fileIndex) || fileIndex < 0) {
    return NextResponse.json(
      { ok: false, error: "Valid hash and fileIndex query params are required." },
      { status: 400 },
    );
  }

  try {
    const status = await getStreamPreparationStatus(hash, fileIndex);
    return NextResponse.json({ ok: true, status });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to inspect stream status." },
      { status: 500 },
    );
  }
}
