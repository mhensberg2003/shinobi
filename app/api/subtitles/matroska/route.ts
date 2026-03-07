import { NextRequest, NextResponse } from "next/server";

import { extractMatroskaSubtitleTrackAsVtt } from "@/lib/seedbox/matroska-subtitles";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const track = Number(req.nextUrl.searchParams.get("track"));
  const debugEnabled = process.env.SUBTITLE_DEBUG === "1";
  const startedAt = Date.now();

  if (!url || !Number.isInteger(track) || track < 1) {
    return NextResponse.json({ error: "Missing or invalid url/track params" }, { status: 400 });
  }

  try {
    if (debugEnabled) {
      console.info("[shinobi:subtitles] route-start", {
        track,
        urlPrefix: url.slice(0, 18),
      });
    }
    const streamUrl = `/api/stream?url=${encodeURIComponent(url)}`;
    const vtt = await extractMatroskaSubtitleTrackAsVtt(streamUrl, track);

    if (debugEnabled) {
      console.info("[shinobi:subtitles] route-success", {
        track,
        urlPrefix: url.slice(0, 18),
        durationMs: Date.now() - startedAt,
        vttBytes: Buffer.byteLength(vtt, "utf8"),
      });
    }

    return new NextResponse(vtt, {
      status: 200,
      headers: {
        "content-type": "text/vtt; charset=utf-8",
        "cache-control": "private, max-age=300",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to extract subtitles";
    if (debugEnabled) {
      console.info("[shinobi:subtitles] route-error", {
        track,
        urlPrefix: url.slice(0, 18),
        durationMs: Date.now() - startedAt,
        message,
      });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
