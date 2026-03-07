import "server-only";

import type { MediaDetail, MediaSearchItem } from "./types";

const TMDB_API_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/original";
const TMDB_POSTER_URL = "https://image.tmdb.org/t/p/w780";

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
  status?: string;
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

function mapResult(result: TmdbSearchResult, genres: Map<number, string>, fallbackType?: TmdbMediaType): MediaSearchItem {
  const mediaType = result.media_type ?? fallbackType ?? "movie";
  const kind = mediaType === "tv" ? "show" : "movie";

  return {
    id: String(result.id),
    provider: "tmdb",
    kind,
    title: result.title || result.name || "Untitled",
    subtitle: mediaType === "tv" ? "TV series" : "Movie",
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

export async function getTmdbDetail(kind: "movie" | "show", id: string): Promise<MediaDetail> {
  const path = kind === "show" ? `/tv/${id}` : `/movie/${id}`;
  const detail = await fetchTmdb<TmdbDetail>(path);

  return {
    id: String(detail.id),
    provider: "tmdb",
    kind,
    title: detail.title || detail.name || "Untitled",
    subtitle: kind === "show" ? "TV series" : "Movie",
    description: detail.overview,
    posterUrl: getImageUrl(detail.poster_path, true),
    backdropUrl: getImageUrl(detail.backdrop_path),
    year: getYear(detail),
    genres: detail.genres?.map((genre) => genre.name),
    score: detail.vote_average ? Math.round(detail.vote_average * 10) : undefined,
    runtimeMinutes: detail.runtime,
    status: detail.status,
    seasonLabel: kind === "show" && detail.number_of_seasons ? `${detail.number_of_seasons} seasons` : undefined,
  };
}
