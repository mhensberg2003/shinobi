import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export type WatchHistoryItem = {
  sessionKey: string;
  title: string;
  posterUrl?: string;
  episodeNumber?: number;
  episodeTotal?: number;
  progressSeconds: number;
  durationSeconds: number;
  updatedAt: string;
};

export async function GET() {
  const rows = await sql`
    SELECT
      session_key,
      title,
      poster_url,
      episode_number,
      episode_total,
      progress_seconds,
      duration_seconds,
      updated_at
    FROM watch_sessions
    WHERE progress_seconds > 5
    ORDER BY updated_at DESC
    LIMIT 20
  `;

  const items: WatchHistoryItem[] = (rows as Record<string, unknown>[]).map((row) => ({
    sessionKey: row.session_key as string,
    title: (row.title as string | null) ?? "Untitled",
    posterUrl: (row.poster_url as string | null) ?? undefined,
    episodeNumber: (row.episode_number as number | null) ?? undefined,
    episodeTotal: (row.episode_total as number | null) ?? undefined,
    progressSeconds: (row.progress_seconds as number) ?? 0,
    durationSeconds: (row.duration_seconds as number) ?? 0,
    updatedAt: (row.updated_at as Date).toISOString(),
  }));

  return NextResponse.json(items);
}
