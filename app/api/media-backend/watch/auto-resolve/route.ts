import { NextResponse } from "next/server";

import { autoResolveWatch } from "@/lib/media-backend/client";
import { getMediaBackendConfig } from "@/lib/media-backend/config";

export async function POST(request: Request) {
  if (!getMediaBackendConfig()) {
    return NextResponse.json(
      { ok: false, error: "Media backend is not configured." },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as {
      requestKey?: string;
      title?: string;
      alternateTitles?: string[];
      provider?: "anilist" | "tmdb";
      mediaId?: string;
      kind?: "anime" | "movie" | "show";
      anilistId?: string;
      posterUrl?: string;
      episodeNumber?: number;
      episodeTotal?: number;
      season?: number;
      year?: number;
    };

    if (!body.title?.trim()) {
      return NextResponse.json({ ok: false, error: "title is required." }, { status: 400 });
    }

    // For anime with an AniList ID, send provider=anilist + the AniList ID
    // so the backend can use it for SeaDex lookups.
    const useAnilist = body.kind === "anime" && body.anilistId;

    const resolution = await autoResolveWatch({
      requestKey: body.requestKey,
      title: body.title,
      alternateTitles: Array.isArray(body.alternateTitles) ? body.alternateTitles : [],
      provider: useAnilist ? "anilist" : body.provider,
      mediaId: useAnilist ? body.anilistId : body.mediaId,
      kind: body.kind,
      posterUrl: body.posterUrl,
      episodeNumber: body.episodeNumber,
      episodeTotal: body.episodeTotal,
      season: body.season,
      year: body.year,
    });

    return NextResponse.json({ ok: true, resolution });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to auto-resolve watch session.",
      },
      { status: 500 },
    );
  }
}
