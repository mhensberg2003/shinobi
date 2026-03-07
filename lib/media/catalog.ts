import "server-only";

import { getAnimeDetail, getTrendingAnime, searchAnime } from "./anilist";
import { getTmdbDetail, getTrendingTmdb, searchTmdb } from "./tmdb";
import type { MediaDetail, MediaSearchItem } from "./types";

export async function getHomeCatalog() {
  const [anime, shows, movies] = await Promise.all([
    getTrendingAnime(),
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
  const [anime, tmdb] = await Promise.all([searchAnime(query), searchTmdb(query).catch(() => [])]);
  return [...anime, ...tmdb];
}

export async function getMediaDetail(
  provider: "anilist" | "tmdb",
  id: string,
  kind?: "anime" | "movie" | "show",
): Promise<MediaDetail> {
  if (provider === "anilist") {
    return getAnimeDetail(id);
  }

  return getTmdbDetail(kind === "show" ? "show" : "movie", id);
}

export function getMediaHref(item: Pick<MediaSearchItem, "provider" | "id" | "kind">): string {
  return `/title/${item.provider}/${item.id}${item.provider === "tmdb" ? `?kind=${item.kind}` : ""}`;
}
