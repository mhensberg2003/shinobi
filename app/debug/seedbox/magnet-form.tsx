"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

export function MagnetForm({
  heading = true,
  successLabel = "Magnet submitted to rTorrent.",
}: {
  heading?: boolean;
  successLabel?: string;
}) {
  const router = useRouter();
  const [magnetLink, setMagnetLink] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = magnetLink.trim();

    if (!trimmed.startsWith("magnet:?")) {
      setError("Provide a valid magnet link.");
      setSuccess(null);
      return;
    }

    setPending(true);
    setError(null);
    setSuccess(null);

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
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Failed to add magnet link.");
      }

      setMagnetLink("");
      setSuccess(successLabel);
      startTransition(() => {
        router.refresh();
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to add magnet link.");
      setSuccess(null);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[28px] border border-white/10 bg-black/20 p-5">
      <div className="flex flex-col gap-3">
        {heading ? (
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Manual magnet input</p>
            <h2 className="mt-2 font-display text-2xl text-white">Create a torrent session</h2>
          </div>
        ) : null}

        <label className="space-y-2">
          <span className="text-sm text-[var(--muted)]">Magnet link</span>
          <textarea
            value={magnetLink}
            onChange={(event) => setMagnetLink(event.target.value)}
            placeholder="magnet:?xt=urn:btih:..."
            rows={5}
            className="min-h-32 w-full resize-y rounded-[24px] border border-white/10 bg-white/6 px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-white/20"
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-6 text-sm">
            {error ? <p className="text-rose-200">{error}</p> : null}
            {success ? <p className="text-emerald-200">{success}</p> : null}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="rounded-full border border-sky-200/18 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/16 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Submitting..." : "Add magnet"}
          </button>
        </div>
      </div>
    </form>
  );
}
