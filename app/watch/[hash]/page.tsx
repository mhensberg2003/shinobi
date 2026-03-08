import { notFound } from "next/navigation";

import { resolveWatchSession } from "@/lib/media-backend/client";
import { getMediaBackendConfig } from "@/lib/media-backend/config";
import { getTorrentDetails } from "@/lib/seedbox/client";
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

  if (session && mediaBackendConfigured) {
    const resolution = await resolveWatchSession(session.trim()).catch(() => null);
    const resolvedSession = resolution?.session;

    if (resolvedSession?.sourceUrl) {
      console.info("[shinobi:watch-page] route-ready-session-source", {
        hash,
        session,
        sourceProvider: resolvedSession.sourceProvider,
        fileIndex: resolvedSession.fileIndex,
      });

      return (
        <WatchPageShell
          requiresStreamPreparation={false}
          storageKey={`shinobi:watch-session:${resolvedSession.sessionKey}`}
          sessionKey={resolvedSession.sessionKey}
          title={title ?? resolvedSession.title ?? "Untitled"}
          streamUrl={`/api/media-backend/watch-sessions/stream?sessionKey=${encodeURIComponent(resolvedSession.sessionKey)}`}
          posterUrl={poster ?? resolvedSession.posterUrl}
          episodeNumber={ep ? Number(ep) : resolvedSession.episodeNumber}
          episodeTotal={eps ? Number(eps) : resolvedSession.episodeTotal}
          magnetLink={resolvedSession.magnetLink}
          torrentHash={resolvedSession.torrentHash ?? hash}
          fileIndex={resolvedSession.fileIndex}
          subtitles={[]}
          demuxRequest={{
            sourceUrl: resolvedSession.sourceUrl,
            torrentHash: resolvedSession.torrentHash ?? hash,
            fileIndex: resolvedSession.fileIndex,
          }}
        />
      );
    }
  }

  const torrent = await getTorrentDetails(hash.trim()).catch(() => null);

  if (!torrent) {
    console.info("[shinobi:watch-page] torrent-not-found", { hash });
    notFound();
  }

  const selectedIndex = Number(file ?? "");
  const selectedFile = Number.isInteger(selectedIndex)
    ? torrent.files.find((f) => f.index === selectedIndex)
    : torrent.files.find((f) => f.isPlayableVideo);

  if (!selectedFile) notFound();

  const prioritized = torrent.files.find((f) => f.index === selectedFile.index) ?? selectedFile;
  const subtitleTracks = torrent.files
    .filter((f) => f.isSubtitle && f.streamUrl)
    .map((f) => ({
      index: f.index,
      label: f.path.split("/").at(-1) ?? f.path,
      src: f.streamUrl as string,
      language: "und",
    }));

  if (!prioritized.streamUrl) {
    console.info("[shinobi:watch-page] missing-stream-url", {
      hash: torrent.hash,
      fileIndex: prioritized.index,
    });
    return (
      <main style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#000" }}>
        <p style={{ color: "#666", fontSize: 14 }}>No stream URL available for this file.</p>
      </main>
    );
  }

  console.info("[shinobi:watch-page] route-ready", {
    hash: torrent.hash,
    fileIndex: prioritized.index,
    subtitleCount: subtitleTracks.length,
    hasSession: Boolean(session),
    mediaBackendConfigured,
  });

  return (
    <WatchPageShell
      storageKey={session ? `shinobi:watch-session:${session}` : `shinobi:watch:${torrent.hash}:${prioritized.index}`}
      sessionKey={session}
      title={title ?? prioritized.path.split("/").at(-1) ?? prioritized.path}
      streamUrl={prioritized.streamUrl}
      posterUrl={poster}
      episodeNumber={ep ? Number(ep) : undefined}
      episodeTotal={eps ? Number(eps) : undefined}
      torrentHash={torrent.hash}
      fileIndex={prioritized.index}
      subtitles={subtitleTracks}
      demuxRequest={
        mediaBackendConfigured
          ? {
              sourceUrl: prioritized.sourceUrl ?? prioritized.streamUrl,
              torrentHash: torrent.hash,
              fileIndex: prioritized.index,
            }
          : undefined
      }
    />
  );
}
