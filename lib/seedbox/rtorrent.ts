import "server-only";

import { requireSeedboxConfig } from "./config";
import { callXmlRpc } from "./xmlrpc";

export type TorrentSummary = {
  hash: string;
  name: string;
  bytesDone: number;
  sizeBytes: number;
  state: number;
  progress: number;
};

export type SeedboxSnapshot = {
  clientVersion: string;
  torrents: TorrentSummary[];
};

export type TorrentFile = {
  index: number;
  path: string;
  absolutePath: string;
  sizeBytes: number;
  completedChunks: number;
  sizeChunks: number;
  progress: number;
  extension: string;
  priority: number;
  createQueued: boolean;
  isPlayableVideo: boolean;
  isSubtitle: boolean;
  sourceUrl?: string;
  streamUrl?: string;
};

export type TorrentDetails = TorrentSummary & {
  basePath: string;
  directoryBase: string;
  isMultiFile: boolean;
  selectedFileIndex?: number;
  files: TorrentFile[];
};

type TorrentMetrics = {
  name: string;
  bytesDone: number;
  sizeBytes: number;
  state: number;
};

async function callRtorrent<T>(method: string, params: unknown[] = []): Promise<T> {
  const config = requireSeedboxConfig();

  return callXmlRpc<T>({
    url: config.rpcUrl,
    username: config.username,
    password: config.password,
    method,
    params,
  });
}

async function getTorrentMetrics(hash: string): Promise<TorrentMetrics> {
  const [name, bytesDone, sizeBytes, state] = await Promise.all([
    callRtorrent<string>("d.name", [hash]),
    callRtorrent<number>("d.bytes_done", [hash]),
    callRtorrent<number>("d.size_bytes", [hash]),
    callRtorrent<number>("d.state", [hash]),
  ]);

  return {
    name,
    bytesDone,
    sizeBytes,
    state,
  };
}

function getProgress(bytesDone: number, sizeBytes: number): number {
  if (sizeBytes <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((bytesDone / sizeBytes) * 100)));
}

function getExtension(path: string): string {
  const parts = path.toLowerCase().split(".");
  return parts.length > 1 ? parts.at(-1) ?? "" : "";
}

function isPlayableVideoExtension(extension: string): boolean {
  return ["mp4", "webm", "m4v", "mov", "mkv"].includes(extension);
}

function isSubtitleExtension(extension: string): boolean {
  return ["srt", "vtt", "ass"].includes(extension);
}

function joinPath(base: string, filePath: string): string {
  return `${base.replace(/\/+$/, "")}/${filePath.replace(/^\/+/, "")}`;
}

function buildSeedboxHttpUrl(absolutePath: string, directoryBase: string): string | undefined {
  const config = requireSeedboxConfig();

  if (!config.httpBaseUrl) {
    return undefined;
  }

  const normalizedDirectory = directoryBase.replace(/\/+$/, "");

  if (!absolutePath.startsWith(`${normalizedDirectory}/`) && absolutePath !== normalizedDirectory) {
    return undefined;
  }

  const relativePath = absolutePath.slice(normalizedDirectory.length).replace(/^\/+/, "");
  const encodedPath = relativePath
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return new URL(encodedPath, `${config.httpBaseUrl.replace(/\/?$/, "/")}`).toString();
}

function buildSeedboxStreamProxyUrl(sourceUrl: string): string {
  // Proxy through Next.js so the browser never hits the seedbox directly (avoids CORS/auth issues)
  const token = Buffer.from(sourceUrl, "utf8").toString("base64url");
  return `/api/stream?url=${token}`;
}

export async function getSeedboxSnapshot(): Promise<SeedboxSnapshot> {
  const [clientVersion, hashes] = await Promise.all([
    callRtorrent<string>("system.client_version"),
    getTorrentHashes(),
  ]);

  const torrents = await Promise.all(
    hashes.map(async (hash) => {
      const metrics = await getTorrentMetrics(hash);

      return {
        hash,
        ...metrics,
        progress: getProgress(metrics.bytesDone, metrics.sizeBytes),
      };
    }),
  );

  torrents.sort((left, right) => right.progress - left.progress);

  return {
    clientVersion,
    torrents,
  };
}

export async function getTorrentHashes(): Promise<string[]> {
  return callRtorrent<string[]>("download_list");
}

export async function addMagnetLink(magnetLink: string): Promise<void> {
  const normalizedMagnet = magnetLink.trim();

  if (!normalizedMagnet.startsWith("magnet:?")) {
    throw new Error("Invalid magnet link.");
  }

  await callRtorrent<number>("load.start", ["", normalizedMagnet]);
}

export async function getTorrentDetails(hash: string): Promise<TorrentDetails> {
  const [metrics, basePath, directoryBase, isMultiFile, selectedFileIndex, rawFiles] = await Promise.all([
    getTorrentMetrics(hash),
    callRtorrent<string>("d.base_path", [hash]),
    callRtorrent<string>("d.directory_base", [hash]),
    callRtorrent<number>("d.is_multi_file", [hash]),
    callRtorrent<string>("d.custom1", [hash]).catch(() => ""),
    callRtorrent<Array<[string, number, number, number, number, number]>>("f.multicall", [
      hash,
      "",
      "f.path=",
      "f.size_bytes=",
      "f.completed_chunks=",
      "f.size_chunks=",
      "f.priority=",
      "f.is_create_queued=",
    ]),
  ]);

  const files = rawFiles.map((file, index) => {
    const [path, sizeBytes, completedChunks, sizeChunks, priority, createQueued] = file;
    const absolutePath =
      path.startsWith("/") || !isMultiFile
        ? path.startsWith("/")
          ? path
          : joinPath(directoryBase, path)
        : joinPath(basePath, path);
    const extension = getExtension(path);
    const progress =
      sizeChunks > 0 ? Math.max(0, Math.min(100, Math.round((completedChunks / sizeChunks) * 100))) : 0;

    const sourceUrl = buildSeedboxHttpUrl(absolutePath, directoryBase);

    return {
      index,
      path,
      absolutePath,
      sizeBytes,
      completedChunks,
      sizeChunks,
      progress,
      extension,
      priority,
      createQueued: Boolean(createQueued),
      isPlayableVideo: isPlayableVideoExtension(extension),
      isSubtitle: isSubtitleExtension(extension),
      sourceUrl,
      streamUrl: sourceUrl ? buildSeedboxStreamProxyUrl(sourceUrl) : undefined,
    };
  });

  return {
    hash,
    ...metrics,
    progress: getProgress(metrics.bytesDone, metrics.sizeBytes),
    basePath,
    directoryBase,
    isMultiFile: Boolean(isMultiFile),
    selectedFileIndex: Number.isInteger(Number(selectedFileIndex)) ? Number(selectedFileIndex) : undefined,
    files,
  };
}

export async function selectOnlyTorrentFile(hash: string, fileIndex: number): Promise<void> {
  const details = await getTorrentDetails(hash);

  if (!details.files.some((file) => file.index === fileIndex)) {
    throw new Error("Requested file index does not exist in this torrent.");
  }

  await Promise.all(
    details.files.map((file) => {
      const fileRef = `${hash}:f${file.index}`;
      const isSelected = file.index === fileIndex;

      return Promise.all([
        callRtorrent<number>("f.priority.set", [fileRef, isSelected ? 2 : 0]),
        callRtorrent<number>("f.set_create_queued", [fileRef, isSelected ? 1 : 0]),
      ]);
    }),
  );

  await Promise.all([
    callRtorrent<number>("d.custom1.set", [hash, String(fileIndex)]),
    callRtorrent<number>("d.update_priorities", [hash]),
    callRtorrent<number>("d.start", [hash]).catch(() => 0),
  ]);
}
