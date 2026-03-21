import "server-only";

import type { MediaDetail, MediaEpisode, MediaSearchItem } from "./types";

const TMDB_API_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/original";
const TMDB_POSTER_URL = "https://image.tmdb.org/t/p/w780";

const ANIMATION_GENRE_ID = 16;

type TmdbMediaType = "movie" | "tv";

type TmdbSearchResult = {
  id: number;
  media_type?: TmdbMediaType;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  genre_ids?: number[];
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  origin_country?: string[];
};

type TmdbGenreResponse = {
  genres: Array<{
    id: number;
    name: string;
  }>;
};

type TmdbDetail = {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  genres?: Array<{ id: number; name: string }>;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  status?: string;
  origin_country?: string[];
  episode_run_time?: number[];
  seasons?: Array<{
    id: number;
    season_number: number;
    name?: string;
    episode_count?: number;
  }>;
};

type TmdbSeasonDetail = {
  season_number: number;
  episodes: Array<{
    id: number;
    episode_number: number;
    name?: string;
    overview?: string;
    still_path?: string;
    air_date?: string;
    runtime?: number;
  }>;
};

function getTmdbToken(): string | null {
  return process.env.TMDB_READ_ACCESS_TOKEN?.trim() || null;
}

async function fetchTmdb<T>(path: string, searchParams?: URLSearchParams): Promise<T> {
  const token = getTmdbToken();

  if (!token) {
    throw new Error("Missing TMDB_READ_ACCESS_TOKEN.");
  }

  const url = new URL(`${TMDB_API_URL}${path}`);

  if (searchParams) {
    url.search = searchParams.toString();
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "force-cache",
    next: {
      revalidate: 3600,
    },
  });

  if (!response.ok) {
    throw new Error(`TMDB request failed with ${response.status}.`);
  }

  return response.json() as Promise<T>;
}

function getImageUrl(path?: string, poster = false): string | undefined {
  if (!path) {
    return undefined;
  }

  return `${poster ? TMDB_POSTER_URL : TMDB_IMAGE_URL}${path}`;
}

function getYear(result: TmdbSearchResult | TmdbDetail): number | undefined {
  const raw = result.release_date || result.first_air_date;
  return raw ? Number(raw.slice(0, 4)) : undefined;
}

function isJapaneseAnimation(result: { genre_ids?: number[]; genres?: Array<{ id: number }>; origin_country?: string[] }): boolean {
  const hasAnimation = result.genre_ids?.includes(ANIMATION_GENRE_ID) || result.genres?.some((g) => g.id === ANIMATION_GENRE_ID);
  const isJapanese = result.origin_country?.includes("JP");
  return Boolean(hasAnimation && isJapanese);
}

function mapResult(result: TmdbSearchResult, genres: Map<number, string>, fallbackType?: TmdbMediaType): MediaSearchItem {
  const mediaType = result.media_type ?? fallbackType ?? "movie";
  const isAnime = mediaType === "tv" && isJapaneseAnimation(result);
  const kind = isAnime ? "anime" : mediaType === "tv" ? "show" : "movie";

  return {
    id: String(result.id),
    provider: "tmdb",
    kind,
    title: result.title || result.name || "Untitled",
    subtitle: isAnime ? "Anime" : mediaType === "tv" ? "TV series" : "Movie",
    description: result.overview,
    posterUrl: getImageUrl(result.poster_path, true),
    backdropUrl: getImageUrl(result.backdrop_path),
    year: getYear(result),
    genres: result.genre_ids?.map((genreId) => genres.get(genreId)).filter(Boolean) as string[] | undefined,
    score: result.vote_average ? Math.round(result.vote_average * 10) : undefined,
  };
}

export async function getTmdbGenres(type: TmdbMediaType): Promise<Map<number, string>> {
  const data = await fetchTmdb<TmdbGenreResponse>(`/genre/${type}/list`);
  return new Map(data.genres.map((genre) => [genre.id, genre.name]));
}

export async function searchTmdb(query: string): Promise<MediaSearchItem[]> {
  if (!query.trim()) {
    return [];
  }

  const [movieGenres, tvGenres, data] = await Promise.all([
    getTmdbGenres("movie"),
    getTmdbGenres("tv"),
    fetchTmdb<{ results: TmdbSearchResult[] }>(
      "/search/multi",
      new URLSearchParams({
        query,
        include_adult: "false",
      }),
    ),
  ]);

  return data.results
    .filter((result) => result.media_type === "movie" || result.media_type === "tv")
    .map((result) => mapResult(result, result.media_type === "tv" ? tvGenres : movieGenres));
}

export async function getTrendingTmdb(type: TmdbMediaType): Promise<MediaSearchItem[]> {
  const [genres, data] = await Promise.all([
    getTmdbGenres(type),
    fetchTmdb<{ results: TmdbSearchResult[] }>(`/trending/${type}/week`),
  ]);

  return data.results.map((result) => mapResult({ ...result, media_type: type }, genres, type));
}

export async function getTrendingAnime(): Promise<MediaSearchItem[]> {
  const [genres, data] = await Promise.all([
    getTmdbGenres("tv"),
    fetchTmdb<{ results: TmdbSearchResult[] }>(
      "/discover/tv",
      new URLSearchParams({
        with_genres: String(ANIMATION_GENRE_ID),
        with_origin_country: "JP",
        sort_by: "popularity.desc",
      }),
    ),
  ]);

  // Results from this endpoint are already filtered to JP animation,
  // but origin_country isn't always present in discover results,
  // so force it so mapResult correctly tags them as anime.
  return data.results.map((result) =>
    mapResult({ ...result, media_type: "tv", origin_country: result.origin_country ?? ["JP"] }, genres, "tv"),
  );
}

export async function fetchSeasonEpisodes(tvId: string, seasonNumber: number): Promise<MediaEpisode[]> {
  const season = await fetchTmdb<TmdbSeasonDetail>(`/tv/${tvId}/season/${seasonNumber}`);

  return season.episodes.map((ep) => ({
    id: `${tvId}-s${seasonNumber}-e${ep.episode_number}`,
    number: ep.episode_number,
    title: ep.name || `Episode ${ep.episode_number}`,
    description: ep.overview || undefined,
    imageUrl: getImageUrl(ep.still_path),
    airedAt: ep.air_date || undefined,
  }));
}

export async function getTmdbDetail(kind: "movie" | "show" | "anime", id: string): Promise<MediaDetail> {
  const isTV = kind === "show" || kind === "anime";
  const path = isTV ? `/tv/${id}` : `/movie/${id}`;
  const detail = await fetchTmdb<TmdbDetail>(path);

  const isAnime = kind === "anime" || (isTV && isJapaneseAnimation(detail));
  const resolvedKind = isAnime ? "anime" : kind;

  // Build real seasons list (exclude season 0 = specials)
  const seasons = isTV
    ? (detail.seasons ?? [])
        .filter((s) => s.season_number > 0)
        .map((s) => ({
          number: s.season_number,
          name: s.name || `Season ${s.season_number}`,
          episodeCount: s.episode_count ?? 0,
        }))
    : undefined;

  // Fetch first real season's episodes
  let episodes: MediaEpisode[] | undefined;
  if (isTV && seasons && seasons.length > 0) {
    try {
      episodes = await fetchSeasonEpisodes(id, seasons[0].number);
    } catch {
      // Season data unavailable
    }
  }

  const episodeRuntime = detail.episode_run_time?.[0];
  const realSeasonCount = seasons?.length ?? detail.number_of_seasons;

  return {
    id: String(detail.id),
    provider: "tmdb",
    kind: resolvedKind,
    title: detail.title || detail.name || "Untitled",
    subtitle: isAnime ? "Anime" : isTV ? "TV series" : "Movie",
    description: detail.overview,
    posterUrl: getImageUrl(detail.poster_path, true),
    backdropUrl: getImageUrl(detail.backdrop_path),
    year: getYear(detail),
    genres: detail.genres?.map((genre) => genre.name),
    score: detail.vote_average ? Math.round(detail.vote_average * 10) : undefined,
    runtimeMinutes: detail.runtime || episodeRuntime,
    status: detail.status,
    episodes,
    seasons,
    numberOfSeasons: isTV ? realSeasonCount : undefined,
    seasonLabel:
      isTV && realSeasonCount
        ? `${realSeasonCount} season${realSeasonCount > 1 ? "s" : ""}`
        : undefined,
  };
}
