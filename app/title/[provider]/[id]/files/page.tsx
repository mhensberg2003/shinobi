import Link from "next/link";
import { notFound } from "next/navigation";

import { getMediaDetail } from "@/lib/media/catalog";
import { getTorrentDetails } from "@/lib/seedbox/rtorrent";
import { SelectAndWatchButton } from "./select-and-watch-button";

type PageProps = {
  params: Promise<{
    provider: "anilist" | "tmdb";
    id: string;
  }>;
  searchParams: Promise<{
    hash?: string;
    magnet?: string;
    kind?: "anime" | "movie" | "show";
    episode?: string;
  }>;
};

function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export const dynamic = "force-dynamic";

export default async function TitleFilesPage({ params, searchParams }: PageProps) {
  const [{ provider, id }, { hash, magnet, kind, episode }] = await Promise.all([params, searchParams]);

  if (!hash || !magnet) {
    notFound();
  }

  const [detail, torrent] = await Promise.all([
    getMediaDetail(provider, id, kind).catch(() => null),
    getTorrentDetails(hash).catch(() => null),
  ]);

  if (!detail || !torrent) {
    notFound();
  }

  const playableFiles = torrent.files.filter((file) => file.isPlayableVideo);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-6">
        <section className="glass-panel-strong rounded-[32px] p-8">
          <Link
            href={`/title/${provider}/${id}/play?${new URLSearchParams(
              Object.fromEntries(
                Object.entries({
                  kind,
                  episode,
                }).filter(([, value]) => value),
              ) as Record<string, string>,
            ).toString()}`}
            className="text-sm text-[var(--muted)] transition hover:text-white"
          >
            Back to magnet step
          </Link>
          <p className="mt-4 text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Step 3</p>
          <h1 className="mt-2 font-display text-4xl text-white">
            Pick the file to stream
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
            {episode ? `${detail.title} · ${episode}` : detail.title}. Choose the actual media file.
            We will prioritize only that file in rTorrent and send you directly to the player.
          </p>
        </section>

        <section className="glass-panel rounded-[32px] p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Torrent files</p>
              <h2 className="mt-2 font-display text-2xl text-white">{torrent.name}</h2>
            </div>
            <p className="text-sm text-[var(--muted)]">{playableFiles.length} playable files</p>
          </div>

          <div className="space-y-4">
            {playableFiles.map((file) => (
              <article
                key={`${file.path}-${file.index}`}
                className="rounded-[28px] border border-white/10 bg-black/20 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-emerald-200/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                        Playable video
                      </span>
                      {torrent.selectedFileIndex === file.index ? (
                        <span className="rounded-full border border-sky-200/20 bg-sky-300/10 px-3 py-1 text-xs font-semibold text-sky-100">
                          Current selection
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-3 break-all text-base font-semibold text-white">{file.path}</h3>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {formatBytes(file.sizeBytes)} · {file.progress}% ready
                    </p>
                  </div>

                  <SelectAndWatchButton
                    hash={hash}
                    fileIndex={file.index}
                    magnetLink={magnet}
                    title={episode ? `${detail.title} ${episode}` : detail.title}
                    posterUrl={detail.posterUrl}
                    episodeNumber={undefined}
                    episodeTotal={undefined}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
