export type MediaKind = "anime" | "movie" | "show";

export type MediaProvider = "anilist" | "tmdb" | "custom";

export type MediaSearchItem = {
  id: string;
  provider: MediaProvider;
  kind: MediaKind;
  title: string;
  subtitle?: string;
  description?: string;
  posterUrl?: string;
  backdropUrl?: string;
  backdropVideoUrl?: string;
  year?: number;
  genres?: string[];
  score?: number;
  posterIsLogo?: boolean;
};

export type MediaEpisode = {
  id: string;
  number: number;
  title: string;
  description?: string;
  imageUrl?: string;
  airedAt?: string;
};

export type MediaSeason = {
  number: number;
  name: string;
  episodeCount: number;
};

export type MediaDetail = MediaSearchItem & {
  runtimeMinutes?: number;
  status?: string;
  episodes?: MediaEpisode[];
  seasonLabel?: string;
  numberOfSeasons?: number;
  seasons?: MediaSeason[];
  anilistId?: string;
  anilistIds?: string[];
};
