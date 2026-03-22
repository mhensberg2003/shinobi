import { notFound } from "next/navigation";

import { resolveWatchSession } from "@/lib/media-backend/client";
import { getMediaBackendConfig } from "@/lib/media-backend/config";
import { WatchPageShell } from "./watch-shell-loader";

type PageProps = {
  params: Promise<{ hash: string }>;
  searchParams: Promise<{ file?: string; poster?: string; title?: string; ep?: string; eps?: string; session?: string }>;
};

export const dynamic = "force-dynamic";

export default async function WatchPage({ params, searchParams }: PageProps) {
  const [{ hash }, { file, poster, title, ep, eps, session }] = await Promise.all([params, searchParams]);
  const mediaBackendConfigured = Boolean(getMediaBackendConfig());
  console.info("[shinobi:watch-page] route-start", {
    hash,
    file,
    hasPoster: Boolean(poster),
    hasTitle: Boolean(title),
    ep,
    eps,
    session,
  });

  if (!session || !mediaBackendConfigured) {
    console.info("[shinobi:watch-page] session-required", {
      hash,
      hasSession: Boolean(session),
      mediaBackendConfigured,
    });
    notFound();
  }

  const resolution = await resolveWatchSession(session.trim()).catch(() => null);
  const resolvedSession = resolution?.session;

  if (!resolvedSession?.sourceUrl) {
    console.info("[shinobi:watch-page] session-source-unavailable", { hash, session });
    notFound();
  }

  console.info("[shinobi:watch-page] route-ready-session-source", {
    hash,
    session,
    sourceProvider: resolvedSession.sourceProvider,
    fileIndex: resolvedSession.fileIndex,
  });

  return (
    <WatchPageShell
      requiresStreamPreparation={false}
      restrictForwardSeeksToBuffered={false}
      resumeTime={resolvedSession.progressSeconds ?? undefined}
      sessionKey={resolvedSession.sessionKey}
      title={title ?? resolvedSession.title ?? "Untitled"}
      streamUrl={`/api/media-backend/watch-sessions/stream?sessionKey=${encodeURIComponent(resolvedSession.sessionKey)}`}
      posterUrl={poster ?? resolvedSession.posterUrl}
      episodeNumber={ep ? Number(ep) : resolvedSession.episodeNumber}
      episodeTotal={eps ? Number(eps) : resolvedSession.episodeTotal}
      magnetLink={resolvedSession.magnetLink}
      torrentHash={resolvedSession.torrentHash ?? hash}
      fileIndex={Number(file ?? resolvedSession.fileIndex)}
      subtitles={[]}
      demuxRequest={
        {
          sourceUrl: resolvedSession.sourceUrl,
          torrentHash: resolvedSession.torrentHash ?? hash,
          fileIndex: Number(file ?? resolvedSession.fileIndex),
        }
      }
    />
  );
}
