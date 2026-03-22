"use client";

import { useRouter } from "next/navigation";
import { startTransition } from "react";
import { randomUUID } from "@/lib/uuid";

export function PlayIntake({
  title,
  alternateTitles,
  provider,
  mediaId,
  kind,
  anilistId,
  posterUrl,
  year,
  episode,
  episodeNumber,
  episodeTotal,
}: {
  title: string;
  alternateTitles?: string[];
  provider: "anilist" | "tmdb";
  mediaId: string;
  kind: "anime" | "movie" | "show";
  anilistId?: string;
  posterUrl?: string;
  year?: number;
  episode?: string;
  episodeNumber?: number;
  episodeTotal?: number;
}) {
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const requestKey = randomUUID();
    const params = new URLSearchParams({
      requestKey,
      title,
    });

    for (const alt of alternateTitles ?? []) {
      params.append("alt", alt);
    }

    params.set("provider", provider);
    params.set("mediaId", mediaId);
    params.set("kind", kind);
    if (posterUrl) {
      params.set("poster", posterUrl);
    }
    if (year != null) {
      params.set("year", String(year));
    }
    params.set("hint", episode ? `${title} ${episode}` : title);
    if (episodeNumber != null) {
      params.set("ep", String(episodeNumber));
    }
    if (episodeTotal != null) {
      params.set("eps", String(episodeTotal));
    }
    if (anilistId) {
      params.set("anilistId", anilistId);
    }

    startTransition(() => {
      router.push(`/watch/start?${params.toString()}`);
    });
  }

  return (
    <section className="glass-panel rounded-[32px] p-8">
      <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Step 2</p>
      <h2 className="mt-2 font-display text-3xl text-white">Auto-find the torrent</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
        {episode
          ? `You are starting ${title} ${episode}.`
          : `You are starting ${title}.`} Shinobi will search Nyaa, rank releases by seeders and quality, pick the right file automatically, and open the player when the stream is ready.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="min-h-6 text-sm text-[var(--muted)]">
            You will be taken to a full-screen loading view while the stream is prepared.
          </p>
          <button
            type="submit"
            className="rounded-full border border-sky-200/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/16 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Find torrent and play
          </button>
        </div>
      </form>
    </section>
  );
}
