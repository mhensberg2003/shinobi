import Link from "next/link";
import { notFound } from "next/navigation";

import { getMediaDetail } from "@/lib/media/catalog";
import { PlayIntake } from "./play-intake";

type PageProps = {
  params: Promise<{
    provider: "anilist" | "tmdb";
    id: string;
  }>;
  searchParams: Promise<{
    kind?: "anime" | "movie" | "show";
    episode?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function TitlePlayPage({ params, searchParams }: PageProps) {
  const [{ provider, id }, { kind, episode }] = await Promise.all([params, searchParams]);

  if (provider !== "anilist" && provider !== "tmdb") {
    notFound();
  }

  const detail = await getMediaDetail(provider, id, kind).catch(() => null);

  if (!detail) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-6">
        <section className="glass-panel-strong rounded-[32px] p-8">
          <Link
            href={`/title/${provider}/${id}${provider === "tmdb" && kind ? `?kind=${kind}` : ""}`}
            className="text-sm text-[var(--muted)] transition hover:text-white"
          >
            Back to title
          </Link>
          <p className="mt-4 text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Step 1</p>
          <h1 className="mt-2 font-display text-4xl text-white">
            {detail.title}
            {episode ? ` · ${episode}` : ""}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
            The flow here is strict: choose what you want to watch, add the magnet, choose the
            exact file inside that torrent, then open the player.
          </p>
        </section>

        <PlayIntake
          provider={provider}
          mediaId={id}
          kind={kind}
          title={detail.title}
          episode={episode}
        />
      </div>
    </main>
  );
}
