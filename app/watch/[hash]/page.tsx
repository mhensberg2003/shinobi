import { notFound } from "next/navigation";

import { WatchPageShell } from "@/components/player/watch-page-shell";
import { getMediaBackendConfig } from "@/lib/media-backend/config";
import { getSeedboxSnapshot, getTorrentDetails } from "@/lib/seedbox/rtorrent";

type PageProps = {
  params: Promise<{ hash: string }>;
  searchParams: Promise<{ file?: string; poster?: string; title?: string; ep?: string; eps?: string }>;
};

export const dynamic = "force-dynamic";

export default async function WatchPage({ params, searchParams }: PageProps) {
  const [{ hash }, { file, poster, title, ep, eps }] = await Promise.all([params, searchParams]);
  const snapshot = await getSeedboxSnapshot();

  if (!snapshot.torrents.some((t) => t.hash === hash)) notFound();

  const torrent = await getTorrentDetails(hash);
  const selectedIndex = Number(file ?? "");
  const selectedFile = Number.isInteger(selectedIndex)
    ? torrent.files.find((f) => f.index === selectedIndex)
    : torrent.files.find((f) => f.isPlayableVideo);

  if (!selectedFile) notFound();

  const prioritized = torrent.files.find((f) => f.index === selectedFile.index) ?? selectedFile;
  const mediaBackendConfigured = Boolean(getMediaBackendConfig());

  const subtitleTracks = torrent.files
    .filter((f) => f.isSubtitle && f.streamUrl)
    .map((f) => ({
      index: f.index,
      label: f.path.split("/").at(-1) ?? f.path,
      src: f.streamUrl as string,
      language: "und",
    }));

  if (!prioritized.streamUrl) {
    return (
      <main style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#000" }}>
        <p style={{ color: "#666", fontSize: 14 }}>No stream URL available for this file.</p>
      </main>
    );
  }

  return (
    <WatchPageShell
      storageKey={`shinobi:watch:${torrent.hash}:${prioritized.index}`}
      title={title ?? prioritized.path.split("/").at(-1) ?? prioritized.path}
      streamUrl={prioritized.streamUrl}
      posterUrl={poster}
      episodeNumber={ep ? Number(ep) : undefined}
      episodeTotal={eps ? Number(eps) : undefined}
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
