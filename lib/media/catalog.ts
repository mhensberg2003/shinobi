import "server-only";

import { lookupAniListIds } from "./anilist";
import { getOnePaceDetail } from "./custom/one-pace";
import { getTmdbDetail, getTrendingAnime, getTrendingTmdb, searchTmdb } from "./tmdb";
import type { MediaDetail, MediaSearchItem } from "./types";

/** All custom entries available for search and browse. */
function getCustomEntries(): MediaSearchItem[] {
  const op = getOnePaceDetail();
  return [
    {
      id: op.id,
      provider: op.provider,
      kind: op.kind,
      title: op.title,
      description: op.description,
      posterUrl: op.posterUrl,
      year: op.year,
      genres: op.genres,
    },
  ];
}

function searchCustomEntries(query: string): MediaSearchItem[] {
  const q = query.toLowerCase();
  return getCustomEntries().filter(
    (e) =>
      e.title.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q),
  );
}

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
  const [tmdbResults, customResults] = await Promise.all([
    searchTmdb(query).catch(() => []),
    Promise.resolve(searchCustomEntries(query)),
  ]);
  return [...customResults, ...tmdbResults];
}

export async function getMediaDetail(
  provider: "anilist" | "tmdb" | "custom",
  id: string,
  kind?: "anime" | "movie" | "show",
): Promise<MediaDetail> {
  if (provider === "custom" && id === "one-pace") {
    return getOnePaceDetail();
  }

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
  if (item.provider === "custom") return `/title/custom/${item.id}`;
  return `/title/tmdb/${item.id}?kind=${item.kind}`;
}
