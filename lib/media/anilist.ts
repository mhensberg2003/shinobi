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

function extractEpisodeNumber(title?: string): number | null {
  if (!title) {
    return null;
  }

  const match = title.match(/\bepisode\s+(\d+)\b/i) ?? title.match(/\bep\.?\s*(\d+)\b/i);
  if (!match) {
    return null;
  }

  const value = Number(match[1]);
  return Number.isInteger(value) && value > 0 ? value : null;
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

  const rawStreamingEpisodes = (media.streamingEpisodes ?? [])
    .map((episode, index) => ({
      originalIndex: index,
      explicitNumber: extractEpisodeNumber(episode.title),
      title: episode.title,
      imageUrl: episode.thumbnail,
    }));

  const hasExplicitNumbers =
    rawStreamingEpisodes.length > 0 &&
    rawStreamingEpisodes.every((episode) => episode.explicitNumber !== null);

  const orderedStreamingEpisodes =
    hasExplicitNumbers
      ? [...rawStreamingEpisodes].sort(
          (left, right) => {
            const leftNum = left.explicitNumber ?? Number.MAX_SAFE_INTEGER;
            const rightNum = right.explicitNumber ?? Number.MAX_SAFE_INTEGER;
            return leftNum - rightNum;
          },
        )
      : rawStreamingEpisodes;

  const streamingEpsMap = new Map(
    orderedStreamingEpisodes.map((episode) => [
      episode.explicitNumber,
      {
        title: episode.title,
        imageUrl: episode.imageUrl,
      },
    ]),
  );

  const episodes: MediaEpisode[] = Array.from({ length: episodeCount }, (_, index) => {
    const epNumber = index + 1;
    const streamingData = streamingEpsMap.get(epNumber);
    return {
      id: `${media.id}-${epNumber}`,
      number: epNumber,
      title: streamingData?.title ?? `Episode ${epNumber}`,
      imageUrl: streamingData?.imageUrl,
    };
  });

  if (orderedStreamingEpisodes.some((ep) => ep.explicitNumber === 0)) {
    const ep0Data = orderedStreamingEpisodes.find((ep) => ep.explicitNumber === 0);
    if (ep0Data) {
      episodes.unshift({
        id: `${media.id}-0`,
        number: 0,
        title: ep0Data.title ?? `Episode 0`,
        imageUrl: ep0Data.imageUrl,
      });
    }
  }

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
