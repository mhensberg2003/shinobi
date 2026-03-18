"use client";

import { useRouter } from "next/navigation";

type Episode = {
  id: string | number;
  number: number;
  title?: string;
  description?: string;
  imageUrl?: string;
  airedAt?: string;
};

type Props = {
  episodes: Episode[];
  title: string;
  alternateTitles?: string[];
  provider?: "anilist" | "tmdb";
  mediaId?: string;
  kind?: "anime" | "movie" | "show";
  posterUrl?: string;
  year?: number;
  runtimeMinutes?: number;
  seasonLabel?: string;
};

function formatEpisodeDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export function EpisodeList({ episodes, title, alternateTitles, provider, mediaId, kind, posterUrl, year, runtimeMinutes, seasonLabel }: Props) {
  const router = useRouter();

  function playEpisode(ep: Episode) {
    const fallbackTitle = `Episode ${ep.number}`;
    const epTitle = ep.title || fallbackTitle;
    const hint = `${title} · Episode ${ep.number}${ep.title && ep.title !== fallbackTitle ? ` — ${ep.title}` : ""}`;

    const params = new URLSearchParams({
      requestKey: crypto.randomUUID(),
      title,
    });
    for (const alt of alternateTitles ?? []) params.append("alt", alt);
    if (provider) params.set("provider", provider);
    if (mediaId) params.set("mediaId", mediaId);
    if (kind) params.set("kind", kind);
    if (posterUrl) params.set("poster", posterUrl);
    if (year != null) params.set("year", String(year));
    params.set("hint", hint);
    params.set("ep", String(ep.number));
    params.set("eps", String(episodes.length));

    router.push(`/watch/start?${params.toString()}`);
  }

  return (
    <section className="mb-14">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-white">Episodes</h2>
        {seasonLabel && (
          <div className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white/60">
            {seasonLabel}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        )}
      </div>

      <div>
        {episodes.map((ep, i) => {
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
                {/* Play overlay on hover */}
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
                  <p
                    className="mt-1 text-xs leading-5 text-white/46 sm:text-sm sm:leading-6"
                    style={{
                      display: "-webkit-box",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 2,
                      overflow: "hidden",
                    }}
                  >
                    {description}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
