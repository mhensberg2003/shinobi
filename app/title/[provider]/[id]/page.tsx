import Link from "next/link";
import { notFound } from "next/navigation";

import { MediaCard } from "@/components/media/media-card";
import { PlayButton } from "@/components/play-button";
import { getHomeCatalog, getMediaDetail } from "@/lib/media/catalog";

type PageProps = {
  params: Promise<{ provider: "anilist" | "tmdb"; id: string }>;
  searchParams: Promise<{ kind?: "anime" | "movie" | "show" }>;
};

export const dynamic = "force-dynamic";

export default async function TitlePage({ params, searchParams }: PageProps) {
  const [{ provider, id }, { kind }] = await Promise.all([params, searchParams]);

  if (provider !== "anilist" && provider !== "tmdb") notFound();

  const [detail, catalog] = await Promise.all([
    getMediaDetail(provider, id, kind).catch(() => null),
    getHomeCatalog(),
  ]);

  if (!detail) notFound();

  const related =
    detail.kind === "anime" ? catalog.anime.slice(0, 10)
    : detail.kind === "show" ? catalog.shows.slice(0, 10)
    : catalog.movies.slice(0, 10);

  return (
    <main className="relative min-h-screen">
      {/* backdrop */}
      {detail.backdropUrl && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(20,20,20,0.3) 0%, #141414 60%), url(${detail.backdropUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center top",
          }}
        />
      )}

      <div className="relative z-10 mx-auto max-w-[1400px] px-4 pb-16 pt-6 sm:px-8">
        {/* breadcrumb */}
        <Link href="/search" className="mb-6 inline-block text-sm text-[var(--muted)] transition-colors hover:text-white">
          ← Search
        </Link>

        {/* hero */}
        <div className="mb-10 flex gap-6">
          {detail.posterUrl && (
            <div className="hidden shrink-0 overflow-hidden rounded-lg sm:block" style={{ width: 180, aspectRatio: "2/3" }}>
              <img src={detail.posterUrl} alt={detail.title} className="h-full w-full object-cover" />
            </div>
          )}
          <div className="flex flex-col justify-end">
            <p className="mb-2 text-xs uppercase tracking-widest text-[var(--muted)]">
              {detail.kind}
            </p>
            <h1 className="font-display text-3xl font-semibold text-white sm:text-5xl">{detail.title}</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {[detail.subtitle, detail.year, detail.seasonLabel, detail.runtimeMinutes ? `${detail.runtimeMinutes} min` : null]
                .filter(Boolean).join(" · ")}
            </p>
            {detail.genres && detail.genres.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {detail.genres.map((g) => (
                  <span key={g} className="rounded-full bg-white/8 px-2.5 py-0.5 text-[11px] text-white/70">{g}</span>
                ))}
              </div>
            )}
            {detail.description && (
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">{detail.description}</p>
            )}
            <div className="mt-5">
              <PlayButton
                label={detail.kind === "movie" ? "Play" : "Play"}
                episodeHint={detail.title}
                posterUrl={detail.posterUrl}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", color: "#000", border: "none", borderRadius: 6, padding: "10px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              />
            </div>
          </div>
        </div>

        {/* episodes */}
        {detail.episodes && detail.episodes.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-base font-semibold text-white">Episodes</h2>
            <div className="space-y-2">
              {detail.episodes.map((ep) => (
                <div key={ep.id} className="flex items-center gap-4 rounded-lg bg-[var(--bg2)] px-4 py-3 transition-colors hover:bg-white/6">
                  <span className="w-8 shrink-0 text-sm text-[var(--muted)]">{ep.number}</span>
                  <span className="flex-1 text-sm text-white">{ep.title}</span>
                  <PlayButton
                    label="Play"
                    episodeHint={`${detail.title} · Episode ${ep.number}${ep.title !== `Episode ${ep.number}` ? ` — ${ep.title}` : ""}`}
                    posterUrl={detail.posterUrl}
                    episodeNumber={ep.number}
                    episodeTotal={detail.episodes?.length}
                    style={{ flexShrink: 0, background: "rgba(255,255,255,0.08)", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* related */}
        {related.length > 0 && (
          <section>
            <h2 className="mb-3 text-base font-semibold text-white">More like this</h2>
            <div className="scroll-row">
              {related.map((item) => (
                <MediaCard key={`${item.provider}-${item.id}`} item={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
