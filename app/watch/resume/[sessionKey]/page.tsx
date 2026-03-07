import { notFound, redirect } from "next/navigation";

import { resolveWatchSession } from "@/lib/media-backend/client";
import { getMediaBackendConfig } from "@/lib/media-backend/config";

type PageProps = {
  params: Promise<{ sessionKey: string }>;
};

export const dynamic = "force-dynamic";

export default async function ResumeWatchPage({ params }: PageProps) {
  const { sessionKey } = await params;

  if (!getMediaBackendConfig()) {
    notFound();
  }

  const resolved = await resolveWatchSession(sessionKey).catch(() => null);
  if (!resolved?.session.torrentHash) {
    notFound();
  }

  const query = new URLSearchParams({
    file: String(resolved.session.fileIndex),
    session: resolved.session.sessionKey,
  });

  if (resolved.session.title) {
    query.set("title", resolved.session.title);
  }
  if (resolved.session.posterUrl) {
    query.set("poster", resolved.session.posterUrl);
  }
  if (resolved.session.episodeNumber != null) {
    query.set("ep", String(resolved.session.episodeNumber));
  }
  if (resolved.session.episodeTotal != null) {
    query.set("eps", String(resolved.session.episodeTotal));
  }

  redirect(`/watch/${resolved.session.torrentHash}?${query.toString()}`);
}
