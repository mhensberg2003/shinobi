export type MediaKind = "anime" | "movie" | "show";

export type MediaProvider = "anilist" | "tmdb";

export type MediaSearchItem = {
  id: string;
  provider: MediaProvider;
  kind: MediaKind;
  title: string;
  subtitle?: string;
  description?: string;
  posterUrl?: string;
  backdropUrl?: string;
  year?: number;
  genres?: string[];
  score?: number;
};

export type MediaEpisode = {
  id: string;
  number: number;
  title: string;
  description?: string;
  imageUrl?: string;
  airedAt?: string;
};

export type MediaDetail = MediaSearchItem & {
  runtimeMinutes?: number;
  status?: string;
  episodes?: MediaEpisode[];
  seasonLabel?: string;
};
