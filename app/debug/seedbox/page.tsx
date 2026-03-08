import Link from "next/link";

import { getSeedboxConfig } from "@/lib/seedbox/config";
import { getSeedboxSnapshot } from "@/lib/seedbox/client";
import { MagnetForm } from "./magnet-form";

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

export default async function SeedboxDebugPage() {
  const config = getSeedboxConfig();

  if (!config) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-4 py-16 sm:px-6">
        <section className="glass-panel w-full rounded-[32px] p-8">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Seedbox debug</p>
          <h1 className="mt-3 font-display text-3xl text-white">Missing configuration</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
            Add `SEEDBOX_API_URL`, `SEEDBOX_API_USER`, and `SEEDBOX_API_PASSWORD`
            to your local environment file. The example keys are documented in
            `.env.example`.
          </p>
          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/8"
            >
              Back to dashboard
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const snapshot = await getSeedboxSnapshot();

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-6">
        <section className="glass-panel rounded-[32px] p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Seedbox debug</p>
              <h1 className="mt-2 font-display text-4xl text-white">Live qBittorrent snapshot</h1>
            </div>
            <div className="text-sm text-[var(--muted)]">
              <p>Client version: {snapshot.clientVersion}</p>
              <p>API host: {new URL(config.apiUrl).host}</p>
            </div>
          </div>
        </section>

        <MagnetForm />

        <section className="glass-panel rounded-[32px] p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Torrents</p>
              <h2 className="mt-2 font-display text-2xl text-white">
                {snapshot.torrents.length} active entries
              </h2>
            </div>
            <Link
              href="/api/seedbox/status"
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/8"
            >
              Open JSON status
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {snapshot.torrents.map((torrent) => (
              <article
                key={torrent.hash}
                className="rounded-[28px] border border-white/10 bg-black/20 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold text-white">{torrent.name}</h3>
                    <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                      {torrent.hash}
                    </p>
                  </div>

                  <div className="grid gap-3 text-sm text-[var(--muted)] sm:grid-cols-3">
                    <div className="rounded-2xl bg-white/6 px-4 py-3">
                      <p>Downloaded</p>
                      <p className="mt-1 font-semibold text-white">
                        {formatBytes(torrent.bytesDone)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/6 px-4 py-3">
                      <p>Total size</p>
                      <p className="mt-1 font-semibold text-white">
                        {formatBytes(torrent.sizeBytes)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/6 px-4 py-3">
                      <p>State</p>
                      <p className="mt-1 font-semibold text-white">{torrent.state}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-[var(--muted)]">Progress</span>
                    <span className="font-semibold text-white">{torrent.progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-strong)]"
                      style={{ width: `${torrent.progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <Link
                    href={`/debug/seedbox/${torrent.hash}`}
                    className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/8"
                  >
                    Inspect files
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
