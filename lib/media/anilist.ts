import "server-only";

import type { MediaDetail, MediaEpisode, MediaSearchItem } from "./types";

const ANILIST_GRAPHQL_URL = "https://graphql.anilist.co";

type AniListSearchResponse = {
  Page: {
    media: Array<{
      id: number;
      title: {
        romaji?: string;
        english?: string;
        native?: string;
      };
      description?: string;
      coverImage?: {
        extraLarge?: string;
        large?: string;
      };
      bannerImage?: string;
      episodes?: number;
      genres?: string[];
      averageScore?: number;
      seasonYear?: number;
      format?: string;
      status?: string;
    }>;
  };
};

type AniListMediaResponse = {
  Media: {
    id: number;
    title: {
      romaji?: string;
      english?: string;
      native?: string;
    };
    description?: string;
    coverImage?: {
      extraLarge?: string;
      large?: string;
    };
    bannerImage?: string;
    episodes?: number;
    genres?: string[];
    averageScore?: number;
    seasonYear?: number;
    format?: string;
    status?: string;
    duration?: number;
    nextAiringEpisode?: {
      episode: number;
      timeUntilAiring: number;
    };
    streamingEpisodes?: Array<{
      title?: string;
      thumbnail?: string;
    }>;
  };
};

async function postAniList<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch(ANILIST_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    cache: "force-cache",
    next: {
      revalidate: 3600,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`AniList request failed with ${response.status}.`);
  }

  const payload = (await response.json()) as { data?: T; errors?: Array<{ message: string }> };

  if (!payload.data) {
    throw new Error(payload.errors?.[0]?.message ?? "AniList returned no data.");
  }

  return payload.data;
}

function getAniListTitle(title: { romaji?: string; english?: string; native?: string }): string {
  return title.english || title.romaji || title.native || "Untitled anime";
}

function stripHtml(description?: string): string | undefined {
  return description?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function mapSearchItem(media: AniListSearchResponse["Page"]["media"][number]): MediaSearchItem {
  return {
    id: String(media.id),
    provider: "anilist",
    kind: "anime",
    title: getAniListTitle(media.title),
    subtitle: media.title.romaji && media.title.romaji !== media.title.english ? media.title.romaji : media.format ?? undefined,
    description: stripHtml(media.description),
    posterUrl: media.coverImage?.extraLarge || media.coverImage?.large,
    backdropUrl: media.bannerImage,
    year: media.seasonYear,
    genres: media.genres,
    score: media.averageScore,
  };
}

export async function searchAnime(query: string): Promise<MediaSearchItem[]> {
  if (!query.trim()) {
    return [];
  }

  const data = await postAniList<AniListSearchResponse>(
    `
      query SearchAnime($query: String) {
        Page(perPage: 12) {
          media(search: $query, type: ANIME, sort: SEARCH_MATCH) {
            id
            title {
              romaji
              english
              native
            }
            description(asHtml: false)
            coverImage {
              extraLarge
              large
            }
            bannerImage
            episodes
            genres
            averageScore
            seasonYear
            format
            status
          }
        }
      }
    `,
    { query },
  );

  return data.Page.media.map(mapSearchItem);
}

export async function getTrendingAnime(): Promise<MediaSearchItem[]> {
  const data = await postAniList<AniListSearchResponse>(
    `
      query TrendingAnime {
        Page(perPage: 20) {
          media(type: ANIME, sort: TRENDING_DESC) {
            id
            title {
              romaji
              english
              native
            }
            description(asHtml: false)
            coverImage {
              extraLarge
              large
            }
            bannerImage
            episodes
            genres
            averageScore
            seasonYear
            format
            status
          }
        }
      }
    `,
    {},
  );

  return data.Page.media.map(mapSearchItem);
}

export async function getAnimeDetail(id: string): Promise<MediaDetail> {
  const data = await postAniList<AniListMediaResponse>(
    `
      query AnimeDetail($id: Int) {
        Media(id: $id, type: ANIME) {
          id
          title {
            romaji
            english
            native
          }
          description(asHtml: false)
          coverImage {
            extraLarge
            large
          }
          bannerImage
          episodes
          genres
          averageScore
          seasonYear
          format
          status
          duration
          nextAiringEpisode {
            episode
            timeUntilAiring
          }
          streamingEpisodes {
            title
            thumbnail
          }
        }
      }
    `,
    { id: Number(id) },
  );

  const media = data.Media;
  const title = getAniListTitle(media.title);
  const episodeCount = media.episodes ?? 0;
  const streamingEps = (media.streamingEpisodes ?? [])
    .filter((e) => e.title)
    .map((episode, index) => ({
      id: `${media.id}-${index + 1}`,
      number: index + 1,
      title: episode.title!,
      imageUrl: episode.thumbnail,
    }));
  // prefer streaming episode data if available; otherwise generate from episode count
  const episodes: MediaEpisode[] = streamingEps.length > 0
    ? streamingEps
    : Array.from({ length: episodeCount }, (_, index) => ({
        id: `${media.id}-${index + 1}`,
        number: index + 1,
        title: `Episode ${index + 1}`,
      }));

  return {
    id: String(media.id),
    provider: "anilist",
    kind: "anime",
    title,
    subtitle: media.title.romaji && media.title.romaji !== media.title.english ? media.title.romaji : media.format ?? undefined,
    description: stripHtml(media.description),
    posterUrl: media.coverImage?.extraLarge || media.coverImage?.large,
    backdropUrl: media.bannerImage,
    year: media.seasonYear,
    genres: media.genres,
    score: media.averageScore,
    runtimeMinutes: media.duration,
    status: media.status,
    episodes,
    seasonLabel: media.episodes ? `${media.episodes} episodes` : undefined,
  };
}
