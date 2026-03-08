import { type NextRequest, NextResponse } from "next/server";
import { getSeedboxConfig } from "@/lib/seedbox/config";
import { getTorrentDetails } from "@/lib/seedbox/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!getSeedboxConfig()) {
    return NextResponse.json({ ok: false, error: "Seedbox not configured." }, { status: 503 });
  }

  const hash = req.nextUrl.searchParams.get("hash")?.trim();
  if (!hash) {
    return NextResponse.json({ ok: false, error: "Missing hash." }, { status: 400 });
  }

  try {
    const details = await getTorrentDetails(hash);
    return NextResponse.json({ ok: true, details });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Failed." }, { status: 500 });
  }
}
