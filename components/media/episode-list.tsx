"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { randomUUID } from "@/lib/uuid";

type Episode = {
  id: string | number;
  number: number;
  title?: string;
  description?: string;
  imageUrl?: string;
  airedAt?: string;
};

type Season = {
  number: number;
  name: string;
  episodeCount: number;
};

type Props = {
  episodes: Episode[];
  title: string;
  alternateTitles?: string[];
  provider?: "anilist" | "tmdb" | "custom";
  mediaId?: string;
  kind?: "anime" | "movie" | "show";
  anilistId?: string;
  anilistIds?: string[];
  posterUrl?: string;
  year?: number;
  runtimeMinutes?: number;
  seasonLabel?: string;
  seasons?: Season[];
};

function formatEpisodeDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export function EpisodeList({ episodes: initialEpisodes, title, alternateTitles, provider, mediaId, kind, anilistId, anilistIds, posterUrl, year, runtimeMinutes, seasonLabel, seasons }: Props) {
  const router = useRouter();
  const firstSeason = seasons?.[0]?.number ?? 1;
  const [selectedSeason, setSelectedSeason] = useState(firstSeason);
  const [episodes, setEpisodes] = useState(initialEpisodes);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // close dropdown on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // fetch episodes when season changes
  useEffect(() => {
    if (selectedSeason === firstSeason) {
      setEpisodes(initialEpisodes);
      return;
    }
    if (!mediaId) return;

    setLoading(true);
    fetch(`/api/season?id=${encodeURIComponent(mediaId)}&season=${selectedSeason}`)
      .then((res) => res.json())
      .then((data) => setEpisodes(data))
      .catch(() => setEpisodes([]))
      .finally(() => setLoading(false));
  }, [selectedSeason, mediaId, initialEpisodes, firstSeason]);

  function playEpisode(ep: Episode) {
    const fallbackTitle = `Episode ${ep.number}`;
    const selectedSeasonObj = seasons?.find((s) => s.number === selectedSeason);
    const seasonName = selectedSeasonObj?.name;
    const hint = `${title} · S${selectedSeason} Episode ${ep.number}${ep.title && ep.title !== fallbackTitle ? ` — ${ep.title}` : ""}`;

    // Use the season-specific name as the title when available so the backend
    // searches for e.g. "Stardust Crusaders" instead of just "JoJo's Bizarre Adventure"
    // For custom provider (e.g. One Pace), combine series title + arc name so nyaa
    // search matches e.g. "[One Pace] Arlong Park 08"
    const resolvedTitle =
      provider === "custom" && seasonName && seasonName !== title
        ? `${title} ${seasonName}`
        : seasonName && seasonName !== title
          ? seasonName
          : title;

    const params = new URLSearchParams({ requestKey: randomUUID(), title: resolvedTitle });
    // Always include the series title and any alternates so the backend has context
    if (resolvedTitle !== title) params.append("alt", title);
    for (const alt of alternateTitles ?? []) params.append("alt", alt);
    if (provider) params.set("provider", provider);
    if (mediaId) params.set("mediaId", mediaId);
    if (kind) params.set("kind", kind);
    if (posterUrl) params.set("poster", posterUrl);
    if (year != null) params.set("year", String(year));
    params.set("hint", hint);
    params.set("ep", String(ep.number));
    params.set("eps", String(episodes.length));
    params.set("season", String(selectedSeason));

    // Pick the AniList ID matching this season (arm returns one per season/part)
    const seasonIndex = seasons ? seasons.findIndex((s) => s.number === selectedSeason) : 0;
    const resolvedAnilistId = anilistIds?.[seasonIndex >= 0 ? seasonIndex : 0] ?? anilistId;
    if (resolvedAnilistId) params.set("anilistId", resolvedAnilistId);

    router.push(`/watch/start?${params.toString()}`);
  }

  return (
    <section className="mb-14">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-white">Episodes</h2>

        {/* season picker */}
        {seasons && seasons.length > 1 && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2 text-sm text-white/70 hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              {seasons.find((s) => s.number === selectedSeason)?.name ?? `Season ${selectedSeason}`}
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className="opacity-60 transition-transform duration-200"
                style={{ transform: dropdownOpen ? "rotate(180deg)" : "rotate(0)" }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {dropdownOpen && (
              <div
                className="absolute right-0 top-full mt-1.5 z-20 min-w-[160px] rounded-lg border border-white/10 py-1 overflow-auto"
                style={{ background: "rgba(22,22,22,0.95)", backdropFilter: "blur(16px)", maxHeight: 280, scrollbarWidth: "none" }}
              >
                {seasons.map((s) => (
                  <button
                    key={s.number}
                    type="button"
                    onClick={() => { setSelectedSeason(s.number); setDropdownOpen(false); }}
                    className="flex w-full items-center gap-2 px-3.5 py-2 text-sm text-left transition-colors hover:bg-white/[0.08] cursor-pointer"
                    style={{ color: s.number === selectedSeason ? "#fff" : "rgba(255,255,255,0.55)" }}
                  >
                    {s.number === selectedSeason && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    <span className={s.number !== selectedSeason ? "ml-5" : ""}>{s.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* static label for single-season shows */}
        {(!seasons || seasons.length <= 1) && seasonLabel && (
          <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white/60">
            {seasonLabel}
          </div>
        )}
      </div>

      {/* loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" className="animate-spin">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        </div>
      )}

      {/* episode list */}
      {!loading && (
        <div>
          {episodes.map((ep) => {
            const airDate = formatEpisodeDate(ep.airedAt);
            const fallbackTitle = `Episode ${ep.number}`;
            const epTitle = ep.title || fallbackTitle;
            const description = ep.description?.trim();
            const runtime = runtimeMinutes ? `${runtimeMinutes}m` : null;

            return (
              <button
                key={ep.id}
                type="button"
                onClick={() => playEpisode(ep)}
                className="group flex w-full items-start gap-4 border-b border-white/[0.06] py-4 text-left transition-colors hover:bg-white/[0.03] last:border-b-0 sm:items-center sm:gap-5"
              >
                {/* Episode number */}
                <div className="w-8 shrink-0 pt-1 text-right text-base font-medium text-white/30 sm:pt-0">
                  {ep.number}
                </div>

                {/* Thumbnail */}
                <div className="relative aspect-video w-[120px] shrink-0 overflow-hidden rounded-md bg-white/[0.06] sm:w-[160px]">
                  {ep.imageUrl ? (
                    <img src={ep.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#1d1d1d,#111)]">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="opacity-20">
                        <polygon points="5,3 19,12 5,21" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                  </div>
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium text-white sm:text-base">{epTitle}</span>
                    {runtime && (
                      <span className="shrink-0 text-xs text-white/36 sm:text-sm">{runtime}</span>
                    )}
                  </div>
                  {airDate && !description && (
                    <p className="mt-0.5 text-xs text-white/36">{airDate}</p>
                  )}
                  {description && (
                    <p className="mt-1 text-xs leading-5 text-white/46 sm:text-sm sm:leading-6 line-clamp-2">
                      {description}
                    </p>
                  )}
                </div>
              </button>
            );
          })}

          {episodes.length === 0 && (
            <p className="py-8 text-center text-sm text-white/30">No episodes available for this season.</p>
          )}
        </div>
      )}
    </section>
  );
}
