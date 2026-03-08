import Link from "next/link";

import { PlayerProbe } from "./player-probe";

type PageProps = {
  searchParams: Promise<{
    url?: string;
  }>;
};

export const dynamic = "force-dynamic";

const defaultStreamUrl =
  "/api/stream?url=aHR0cHM6Ly9zMTguZWFzeS10ay5iaXovcnV0b3JyZW50L2ZpbGVzLW1hbmFnZXIvZmlsZXMvaG9tZS9lYXN5MTAxMy90b3JyZW50cy9QYXJ0JTIwMSUyMFBoYW50b20lMjBCbG9vZCUyMCYlMjBQYXJ0JTIwMiUyMEJhdHRsZSUyMFRlbmRlbmN5L0pvSm8ncyUyMEJpemFycmUlMjBBZHZlbnR1cmUlMjAoMjAxMiklMjBTMDFFMjMlMjBUaGUlMjBXYXJyaW9yJTIwb2YlMjBXaW5kLm1rdg";

export default async function StreamTestPage({ searchParams }: PageProps) {
  const { url } = await searchParams;
  const streamUrl = url?.trim() || defaultStreamUrl;

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-6">
        <section className="glass-panel rounded-[32px] p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link href="/debug/seedbox" className="text-sm text-[var(--muted)] transition hover:text-white">
                Back to seedbox debug
              </Link>
              <p className="mt-4 text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                Stream test
              </p>
              <h1 className="mt-2 font-display text-4xl text-white">Direct browser playback lab</h1>
              <p className="mt-3 max-w-3xl text-sm text-[var(--muted)]">
                This page mounts the stream in a real HTML video element so you can test whether your browser can directly decode the source.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Source URL</p>
            <p className="mt-3 break-all font-mono text-xs text-white">{streamUrl}</p>
          </div>
        </section>

        <PlayerProbe key={streamUrl} src={streamUrl} />
      </div>
    </main>
  );
}
