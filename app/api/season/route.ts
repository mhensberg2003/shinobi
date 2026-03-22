import { NextRequest, NextResponse } from "next/server";
import { getOnePaceEpisodes, ONE_PACE_ID } from "@/lib/media/custom/one-pace";
import { fetchSeasonEpisodes } from "@/lib/media/tmdb";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");
  const season = searchParams.get("season");

  if (!id || !season) {
    return NextResponse.json([], { status: 400 });
  }

  const seasonNum = Number(season);
  if (!Number.isFinite(seasonNum) || seasonNum < 1) {
    return NextResponse.json([], { status: 400 });
  }

  // Custom provider: One Pace
  if (id === ONE_PACE_ID) {
    return NextResponse.json(getOnePaceEpisodes(seasonNum));
  }

  try {
    const episodes = await fetchSeasonEpisodes(id, seasonNum);
    return NextResponse.json(episodes);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
