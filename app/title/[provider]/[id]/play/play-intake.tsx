"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

export function PlayIntake({
  provider,
  mediaId,
  kind,
  title,
  episode,
}: {
  provider: "anilist" | "tmdb";
  mediaId: string;
  kind?: "anime" | "movie" | "show";
  title: string;
  episode?: string;
}) {
  const router = useRouter();
  const [magnetLink, setMagnetLink] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = magnetLink.trim();

    if (!trimmed.startsWith("magnet:?")) {
      setError("Provide a valid magnet link.");
      return;
    }

    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/seedbox/magnets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ magnetLink: trimmed }),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        addedHash?: string | null;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Failed to add magnet link.");
      }

      if (!payload.addedHash) {
        throw new Error("Torrent was added, but the new hash could not be detected.");
      }

      const params = new URLSearchParams({
        hash: payload.addedHash,
        magnet: trimmed,
      });

      if (kind) {
        params.set("kind", kind);
      }

      if (episode) {
        params.set("episode", episode);
      }

      startTransition(() => {
        router.push(`/title/${provider}/${mediaId}/files?${params.toString()}`);
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to add magnet link.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="glass-panel rounded-[32px] p-8">
      <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Step 2</p>
      <h2 className="mt-2 font-display text-3xl text-white">Paste the magnet</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
        {episode
          ? `You are starting ${title} ${episode}.`
          : `You are starting ${title}.`} Add the release you want, then we will ask which file inside the torrent should actually be streamed.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <textarea
          value={magnetLink}
          onChange={(event) => setMagnetLink(event.target.value)}
          placeholder="magnet:?xt=urn:btih:..."
          rows={6}
          className="min-h-36 w-full resize-y rounded-[24px] border border-white/10 bg-white/6 px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-white/20"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="min-h-6 text-sm text-rose-200">{error}</p>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full border border-sky-200/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/16 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Adding torrent..." : "Continue to file selection"}
          </button>
        </div>
      </form>
    </section>
  );
}
