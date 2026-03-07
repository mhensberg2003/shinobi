import Link from "next/link";
import { notFound } from "next/navigation";

import { getSeedboxSnapshot, getTorrentDetails } from "@/lib/seedbox/rtorrent";
import { SelectFileButton } from "./select-file-button";

type PageProps = {
  params: Promise<{
    hash: string;
  }>;
  searchParams: Promise<{
    file?: string;
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

export default async function TorrentDetailPage({ params, searchParams }: PageProps) {
  const [{ hash }, { file }] = await Promise.all([params, searchParams]);
  const snapshot = await getSeedboxSnapshot();

  if (!snapshot.torrents.some((torrent) => torrent.hash === hash)) {
    notFound();
  }

  const torrent = await getTorrentDetails(hash);
  const selectedIndex = Number(file ?? "");
  const selectedFile = Number.isInteger(selectedIndex)
    ? torrent.files.find((entry) => entry.index === selectedIndex)
    : torrent.files.find((entry) => entry.isPlayableVideo);
  const subtitleFiles = torrent.files.filter((entry) => entry.isSubtitle);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-6">
        <section className="glass-panel rounded-[32px] p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link
                href="/debug/seedbox"
                className="text-sm text-[var(--muted)] transition hover:text-white"
              >
                Back to seedbox debug
              </Link>
              <p className="mt-4 text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                Torrent detail
              </p>
              <h1 className="mt-2 max-w-4xl font-display text-4xl text-white">
                {torrent.name}
              </h1>
            </div>

            <div className="grid gap-3 text-sm text-[var(--muted)] sm:grid-cols-3">
              <div className="rounded-2xl bg-white/6 px-4 py-3">
                <p>Progress</p>
                <p className="mt-1 font-semibold text-white">{torrent.progress}%</p>
              </div>
              <div className="rounded-2xl bg-white/6 px-4 py-3">
                <p>Size</p>
                <p className="mt-1 font-semibold text-white">{formatBytes(torrent.sizeBytes)}</p>
              </div>
              <div className="rounded-2xl bg-white/6 px-4 py-3">
                <p>Files</p>
                <p className="mt-1 font-semibold text-white">{torrent.files.length}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="glass-panel rounded-[32px] p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                  File selection
                </p>
                <h2 className="mt-2 font-display text-2xl text-white">Choose the stream target</h2>
              </div>
              <p className="text-sm text-[var(--muted)]">{torrent.isMultiFile ? "Multi-file torrent" : "Single-file torrent"}</p>
            </div>

            <div className="mt-6 space-y-4">
              {torrent.files.map((entry) => {
                const isSelected = selectedFile?.index === entry.index;

                return (
                  <article
                    key={`${entry.path}-${entry.index}`}
                    className={`rounded-[28px] border p-5 transition ${
                      isSelected
                        ? "border-sky-200/30 bg-sky-200/8"
                        : "border-white/10 bg-black/20"
                    }`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
                          {entry.isPlayableVideo ? (
                            <span className="rounded-full border border-emerald-200/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                              Playable video
                            </span>
                          ) : null}
                          {entry.isSubtitle ? (
                            <span className="rounded-full border border-cyan-200/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                              Subtitle
                            </span>
                          ) : null}
                          {!entry.isPlayableVideo && !entry.isSubtitle ? (
                            <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-semibold text-white/70">
                              Other asset
                            </span>
                          ) : null}
                        </div>
                        <h3 className="mt-3 break-all text-base font-semibold text-white">
                          {entry.path}
                        </h3>
                        <p className="mt-2 break-all text-sm text-[var(--muted)]">
                          {entry.absolutePath}
                        </p>
                      </div>

                      <div className="grid gap-3 text-sm text-[var(--muted)] sm:grid-cols-2">
                        <div className="rounded-2xl bg-white/6 px-4 py-3">
                          <p>Size</p>
                          <p className="mt-1 font-semibold text-white">
                            {formatBytes(entry.sizeBytes)}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white/6 px-4 py-3">
                          <p>Progress</p>
                          <p className="mt-1 font-semibold text-white">{entry.progress}%</p>
                        </div>
                        <div className="rounded-2xl bg-white/6 px-4 py-3">
                          <p>Priority</p>
                          <p className="mt-1 font-semibold text-white">{entry.priority}</p>
                        </div>
                        <div className="rounded-2xl bg-white/6 px-4 py-3">
                          <p>Queued</p>
                          <p className="mt-1 font-semibold text-white">
                            {entry.createQueued ? "Yes" : "No"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-[var(--muted)]">File completion</span>
                        <span className="font-semibold text-white">{entry.progress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/8">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-strong)]"
                          style={{ width: `${entry.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      {torrent.selectedFileIndex === entry.index ? (
                        <span className="rounded-full border border-emerald-200/20 bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-100">
                          Selected for download
                        </span>
                      ) : null}
                      {entry.isPlayableVideo ? (
                        <SelectFileButton
                          hash={torrent.hash}
                          fileIndex={entry.index}
                          isSelected={torrent.selectedFileIndex === entry.index}
                        />
                      ) : null}
                      <Link
                        href={`/debug/seedbox/${torrent.hash}?file=${entry.index}`}
                        className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/8"
                      >
                        Inspect
                      </Link>
                      {entry.streamUrl && entry.isPlayableVideo ? (
                        <Link
                          href={`/watch/${torrent.hash}?file=${entry.index}`}
                          className="rounded-full border border-sky-200/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/16"
                        >
                          Watch in app
                        </Link>
                      ) : null}
                      {entry.streamUrl && entry.isPlayableVideo ? (
                        <Link
                          href={entry.streamUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full border border-sky-200/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/16"
                        >
                          Open direct stream
                        </Link>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <section className="glass-panel rounded-[32px] p-8">
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Player preview</p>
              <h2 className="mt-2 font-display text-2xl text-white">Direct playback test</h2>

              {selectedFile && selectedFile.isPlayableVideo && selectedFile.streamUrl ? (
                <div className="mt-6 space-y-4">
                  <div className="overflow-hidden rounded-[28px] border border-white/10 bg-black/30">
                    <video
                      key={selectedFile.streamUrl}
                      controls
                      preload="metadata"
                      className="aspect-video w-full bg-black"
                      src={selectedFile.streamUrl}
                    >
                      {subtitleFiles
                        .filter((entry) => entry.streamUrl && entry.extension === "srt")
                        .map((subtitle) => (
                          <track
                            key={subtitle.index}
                            kind="subtitles"
                            src={subtitle.streamUrl}
                            label={subtitle.path.split("/").at(-1) ?? subtitle.path}
                          />
                        ))}
                    </video>
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                    <p className="text-sm text-[var(--muted)]">Selected file</p>
                    <p className="mt-2 break-all font-semibold text-white">{selectedFile.path}</p>
                    <p className="mt-2 break-all text-sm text-[var(--muted)]">
                      {selectedFile.streamUrl}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-[28px] border border-dashed border-white/12 bg-black/20 p-5 text-sm leading-7 text-[var(--muted)]">
                  Select a playable video file. If no direct URL appears, the HTTP base URL
                  does not map cleanly to the torrent directory yet and we will need a proxy
                  or an explicit path mapping.
                </div>
              )}
            </section>

            <section className="glass-panel rounded-[32px] p-8">
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Torrent paths</p>
              <div className="mt-4 space-y-4 text-sm">
                <div className="rounded-2xl bg-white/6 p-4">
                  <p className="text-[var(--muted)]">Base path</p>
                  <p className="mt-2 break-all text-white">{torrent.basePath}</p>
                </div>
                <div className="rounded-2xl bg-white/6 p-4">
                  <p className="text-[var(--muted)]">Directory base</p>
                  <p className="mt-2 break-all text-white">{torrent.directoryBase}</p>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
