import "server-only";

import { lookupAniListIds } from "./anilist";
import { getTmdbDetail, getTrendingAnime, getTrendingTmdb, searchTmdb } from "./tmdb";
import type { MediaDetail, MediaSearchItem } from "./types";

export async function getHomeCatalog() {
  const [anime, shows, movies] = await Promise.all([
    getTrendingAnime().catch(() => []),
    getTrendingTmdb("tv").catch(() => []),
    getTrendingTmdb("movie").catch(() => []),
  ]);

  return {
    anime,
    shows,
    movies,
  };
}

export async function searchCatalog(query: string) {
  return searchTmdb(query).catch(() => []);
}

export async function getMediaDetail(
  provider: "anilist" | "tmdb",
  id: string,
  kind?: "anime" | "movie" | "show",
): Promise<MediaDetail> {
  const resolvedKind = kind ?? "movie";
  const detail = await getTmdbDetail(resolvedKind, id);

  // For anime, map TMDB → AniList via arm so the backend can use the AniList ID for SeaDex.
  // The arm API returns one AniList ID per season/part — store all of them so the
  // correct one can be picked based on the selected season at play time.
  if (detail.kind === "anime") {
    const anilistIds = await lookupAniListIds(id).catch(() => []);
    if (anilistIds.length > 0) {
      detail.anilistId = anilistIds[0];
      detail.anilistIds = anilistIds;
    }
  }

  return detail;
}

export function getMediaHref(item: Pick<MediaSearchItem, "provider" | "id" | "kind">): string {
  return `/title/tmdb/${item.id}?kind=${item.kind}`;
}
