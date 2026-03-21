import "server-only";

type ArmEntry = {
  anilist?: number | null;
  themoviedb?: number | null;
};

/**
 * Look up AniList ID(s) from a TMDB TV ID using the arm (Anime Relations Mapping) API.
 * Returns an array of AniList IDs (one per season/part), ordered as the API returns them.
 * Used for SeaDex lookups on the backend.
 */
export async function lookupAniListIds(tmdbId: string): Promise<string[]> {
  try {
    const response = await fetch(
      `https://arm.haglund.dev/api/v2/themoviedb?id=${encodeURIComponent(tmdbId)}`,
      {
        headers: { Accept: "application/json" },
        cache: "force-cache",
        next: { revalidate: 86400 },
      },
    );

    if (!response.ok) {
      return [];
    }

    const entries = (await response.json()) as ArmEntry[];
    return entries
      .map((e) => e.anilist)
      .filter((id): id is number => id != null)
      .map(String);
  } catch {
    return [];
  }
}
