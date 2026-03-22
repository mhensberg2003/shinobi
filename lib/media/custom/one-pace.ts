import type { MediaDetail, MediaEpisode, MediaSeason } from "../types";

type Arc = { name: string; episodes: number };

const arcs: Arc[] = [
  { name: "Romance Dawn", episodes: 4 },
  { name: "Orange Town", episodes: 3 },
  { name: "Syrup Village", episodes: 7 },
  { name: "Gaimon", episodes: 1 },
  { name: "Baratie", episodes: 8 },
  { name: "Arlong Park", episodes: 10 },
  { name: "The Adventures of Buggy's Crew", episodes: 1 },
  { name: "Loguetown", episodes: 3 },
  { name: "Reverse Mountain", episodes: 2 },
  { name: "Whisky Peak", episodes: 2 },
  { name: "The Trials of Koby-Meppo", episodes: 1 },
  { name: "Little Garden", episodes: 5 },
  { name: "Drum Island", episodes: 8 },
  { name: "Arabasta", episodes: 21 },
  { name: "Jaya", episodes: 8 },
  { name: "Skypiea", episodes: 25 },
  { name: "Long Ring Long Land", episodes: 6 },
  { name: "Water Seven", episodes: 20 },
  { name: "Enies Lobby", episodes: 25 },
  { name: "Post-Enies Lobby", episodes: 5 },
  { name: "Thriller Bark", episodes: 22 },
  { name: "Sabaody Archipelago", episodes: 11 },
  { name: "Amazon Lily", episodes: 5 },
  { name: "Impel Down", episodes: 10 },
  { name: "If You Could Go Anywhere... The Adventures of the Straw Hats", episodes: 1 },
  { name: "Marineford", episodes: 17 },
  { name: "Post-War", episodes: 8 },
  { name: "Return to Sabaody", episodes: 3 },
  { name: "Fishman Island", episodes: 24 },
  { name: "Punk Hazard", episodes: 22 },
  { name: "Dressrosa", episodes: 48 },
  { name: "Zou", episodes: 10 },
  { name: "Whole Cake Island", episodes: 39 },
  { name: "Reverie", episodes: 3 },
  { name: "Wano", episodes: 58 },
  { name: "Egghead", episodes: 20 },
];

export const ONE_PACE_ID = "one-pace";

export const ONE_PACE_SEASONS: MediaSeason[] = arcs.map((arc, i) => ({
  number: i + 1,
  name: arc.name,
  episodeCount: arc.episodes,
}));

export function getOnePaceEpisodes(seasonNumber: number): MediaEpisode[] {
  const arc = arcs[seasonNumber - 1];
  if (!arc) return [];

  return Array.from({ length: arc.episodes }, (_, i) => ({
    id: `one-pace-s${seasonNumber}-e${i + 1}`,
    number: i + 1,
    title: `Episode ${i + 1}`,
  }));
}

export function getOnePaceDetail(): MediaDetail {
  return {
    id: ONE_PACE_ID,
    provider: "custom",
    kind: "anime",
    title: "One Pace",
    description:
      "One Pace is a fan project that recuts the One Piece anime to more closely follow the manga, removing filler and padding for a tighter viewing experience.",
    posterUrl: "https://onepace.net/_next/static/media/logo.0bbcd6da.svg",
    posterIsLogo: true,
    backdropVideoUrl: "https://onepace.net/_next/static/media/backdrop-loop.1625407a.webm",
    year: 1999,
    genres: ["Action", "Adventure", "Fantasy"],
    status: "Ongoing",
    numberOfSeasons: arcs.length,
    seasons: ONE_PACE_SEASONS,
    episodes: getOnePaceEpisodes(1),
  };
}
