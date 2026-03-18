import { notFound } from "next/navigation";

import { EpisodeList } from "@/components/media/episode-list";
import { MediaCard } from "@/components/media/media-card";
import { PlayButton } from "@/components/play-button";
import { getHomeCatalog, getMediaDetail } from "@/lib/media/catalog";

type PageProps = {
  params: Promise<{ provider: "anilist" | "tmdb"; id: string }>;
  searchParams: Promise<{ kind?: "anime" | "movie" | "show" }>;
};

export const dynamic = "force-dynamic";

function formatScore(score?: number) {
  if (typeof score !== "number") return null;
  return `${(score / 10).toFixed(1)}/10`;
}

function formatMeta(detail: Awaited<ReturnType<typeof getMediaDetail>>) {
  return [
    formatScore(detail.score),
    detail.year ? String(detail.year) : null,
    detail.seasonLabel ?? null,
    detail.runtimeMinutes ? `${detail.runtimeMinutes}m` : null,
    detail.status ?? null,
  ].filter(Boolean) as string[];
}

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
  const alternateTitles = detail.kind === "anime" && detail.subtitle ? [detail.subtitle] : [];
  const metaItems = formatMeta(detail);
  const kindLabel = detail.kind === "show" ? "Series" : detail.kind === "anime" ? "Anime" : "Movie";

  return (
    <main className="min-h-screen bg-[#141414] text-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {detail.backdropUrl && (
          <div className="absolute inset-0">
            <img
              src={detail.backdropUrl}
              alt=""
              className="h-full w-full object-cover"
              style={{ objectPosition: "center 28%" }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.14)_0%,rgba(0,0,0,0.42)_40%,rgba(20,20,20,0.92)_78%,#141414_100%)]" />
          </div>
        )}

        <div className="relative z-10 mx-auto flex min-h-[480px] max-w-[1200px] items-end px-6 pb-12 pt-28 sm:px-10 sm:pb-14">
          <div className="max-w-2xl">
            {/* Kind label */}
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.3em] text-white/40">
              {kindLabel}
            </p>

            {/* Title */}
            <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl" style={{ textWrap: "balance" }}>
              {detail.title}
            </h1>

            {/* Meta pills */}
            {metaItems.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {metaItems.map((item) => (
                  <span
                    key={item}
                    className="rounded border border-white/14 bg-black/30 px-2.5 py-0.5 text-xs font-medium text-white/70"
                  >
                    {item}
                  </span>
                ))}
                {detail.genres?.slice(0, 3).map((genre) => (
                  <span key={genre} className="text-xs text-white/40">
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {detail.description && (
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/60 sm:text-base sm:leading-7">
                {detail.description}
              </p>
            )}

            {/* Actions */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <PlayButton
                label={detail.episodes?.length ? "Play S1 E1" : "Play"}
                title={detail.title}
                alternateTitles={alternateTitles}
                provider={provider}
                mediaId={id}
                kind={detail.kind}
                episodeHint={detail.episodes?.length ? `${detail.title} · Episode 1` : detail.title}
                posterUrl={detail.posterUrl}
                year={detail.year}
                episodeNumber={detail.episodes?.length ? 1 : undefined}
                episodeTotal={detail.episodes?.length}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  borderRadius: 6,
                  padding: "10px 22px",
                  background: "#fff",
                  color: "#000",
                  border: "none",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: "0.01em",
                }}
              />
              {detail.subtitle && (
                <span className="rounded border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white/50">
                  {detail.subtitle}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="mx-auto max-w-[1200px] px-6 pb-16 pt-8 sm:px-10">
        {/* Episodes */}
        {detail.episodes && detail.episodes.length > 0 && (
          <EpisodeList
            episodes={detail.episodes}
            title={detail.title}
            alternateTitles={alternateTitles}
            provider={provider}
            mediaId={id}
            kind={detail.kind}
            posterUrl={detail.posterUrl}
            year={detail.year}
            runtimeMinutes={detail.runtimeMinutes}
            seasonLabel={detail.seasonLabel}
          />
        )}

        {/* More like this */}
        {related.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-white">More like this</h2>
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
