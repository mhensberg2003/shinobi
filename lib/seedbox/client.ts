import "server-only";

import { requireSeedboxConfig } from "./config";

export type TorrentSummary = {
  hash: string;
  name: string;
  bytesDone: number;
  sizeBytes: number;
  state: string;
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

export type StreamPreparationStatus = {
  hash: string;
  fileIndex: number;
  ready: boolean;
  progress: number;
  downloadedBytes: number;
  requiredBytes: number;
  message: string;
};

type QbTorrentInfo = {
  hash: string;
  name: string;
  progress: number;
  state: string;
  size?: number;
  total_size?: number;
  completed?: number;
  downloaded?: number;
  content_path?: string;
  save_path?: string;
  seq_dl?: boolean;
  f_l_piece_prio?: boolean;
};

type QbTorrentFile = {
  index: number;
  name: string;
  size: number;
  progress: number;
  priority: number;
  piece_range?: [number, number];
};

type QbSession = {
  request: <T>(path: string, init?: RequestInit, options?: { parseJson?: boolean }) => Promise<T>;
};

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

function getFinalPathSegment(path: string): string {
  const parts = path.replace(/\/+$/, "").split("/");
  return parts.at(-1) ?? "";
}

function toChunkCount(sizeBytes: number): number {
  const chunkSize = 16 * 1024 * 1024;
  return Math.max(1, Math.ceil(Math.max(sizeBytes, 1) / chunkSize));
}

function getCompletedChunks(sizeBytes: number, progress: number, sizeChunks: number): number {
  if (sizeBytes <= 0 || sizeChunks <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(sizeChunks, Math.round((progress / 100) * sizeChunks)));
}

function buildSeedboxHttpUrl(
  absolutePath: string,
  directoryBase: string,
  relativePath?: string,
): string | undefined {
  const config = requireSeedboxConfig();

  if (!config.httpBaseUrl) {
    return undefined;
  }

  const normalizedDirectory = directoryBase.replace(/\/+$/, "");
  const normalizedHttpPathRoot = config.httpPathRoot?.replace(/\/+$/, "");
  let relativeFromRoot: string | undefined;

  if (
    normalizedHttpPathRoot &&
    (absolutePath.startsWith(`${normalizedHttpPathRoot}/`) || absolutePath === normalizedHttpPathRoot)
  ) {
    relativeFromRoot = absolutePath.slice(normalizedHttpPathRoot.length).replace(/^\/+/, "");
  }

  if (!relativeFromRoot) {
    if (absolutePath.startsWith(`${normalizedDirectory}/`) || absolutePath === normalizedDirectory) {
      relativeFromRoot = absolutePath.slice(normalizedDirectory.length).replace(/^\/+/, "");
    } else if (relativePath) {
      relativeFromRoot = relativePath.replace(/^\/+/, "");
    } else {
      return undefined;
    }
  }

  const encodedPath = relativeFromRoot
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return new URL(encodedPath, `${config.httpBaseUrl.replace(/\/?$/, "/")}`).toString();
}

function buildSeedboxStreamProxyUrl(sourceUrl: string): string {
  const token = Buffer.from(sourceUrl, "utf8").toString("base64url");
  return `/api/stream?url=${token}`;
}

function buildSeedboxBasicAuth(): string {
  const config = requireSeedboxConfig();
  return Buffer.from(`${config.httpUsername}:${config.httpPassword}`).toString("base64");
}

function getRequiredStreamBufferBytes(sizeBytes: number): number {
  const minBytes = 8 * 1024 * 1024;
  const maxBytes = 64 * 1024 * 1024;
  const proportionalBytes = Math.floor(sizeBytes * 0.05);

  return Math.min(maxBytes, Math.max(minBytes, proportionalBytes));
}

function estimateDownloadedBytes(file: TorrentFile): number {
  if (file.sizeChunks <= 0 || file.sizeBytes <= 0) {
    return 0;
  }

  return Math.floor((file.completedChunks / file.sizeChunks) * file.sizeBytes);
}

function getTorrentSize(info: QbTorrentInfo): number {
  return info.size ?? info.total_size ?? 0;
}

function getTorrentCompletedBytes(info: QbTorrentInfo): number {
  const sizeBytes = getTorrentSize(info);
  const completed = info.completed ?? info.downloaded;

  if (typeof completed === "number" && Number.isFinite(completed)) {
    return completed;
  }

  return Math.round(sizeBytes * Math.max(0, Math.min(info.progress ?? 0, 1)));
}

function normalizeTorrentSummary(info: QbTorrentInfo): TorrentSummary {
  const sizeBytes = getTorrentSize(info);
  const bytesDone = getTorrentCompletedBytes(info);

  return {
    hash: info.hash,
    name: info.name,
    bytesDone,
    sizeBytes,
    state: info.state,
    progress: getProgress(bytesDone, sizeBytes),
  };
}

async function createSession(): Promise<QbSession> {
  const config = requireSeedboxConfig();
  const baseUrl = new URL(config.apiUrl.endsWith("/") ? config.apiUrl : `${config.apiUrl}/`);
  const origin = baseUrl.origin;

  const loginBody = new URLSearchParams({
    username: config.username,
    password: config.password,
  });

  const loginResponse = await fetch(new URL("api/v2/auth/login", baseUrl), {
    method: "POST",
    headers: {
      Origin: origin,
      Referer: origin,
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
    body: loginBody.toString(),
    cache: "no-store",
  });

  if (!loginResponse.ok) {
    throw new Error(`qBittorrent login failed with status ${loginResponse.status}.`);
  }

  const cookie = loginResponse.headers.get("set-cookie")?.split(";").at(0);
  const loginText = (await loginResponse.text()).trim();

  if (!cookie || loginText !== "Ok.") {
    throw new Error("qBittorrent login failed.");
  }

  return {
    async request<T>(
      path: string,
      init?: RequestInit,
      options?: { parseJson?: boolean },
    ): Promise<T> {
      const response = await fetch(new URL(path.replace(/^\/+/, ""), baseUrl), {
        ...init,
        headers: {
          Cookie: cookie,
          Origin: origin,
          Referer: origin,
          ...(init?.headers ?? {}),
        },
        cache: "no-store",
      });

      if (!response.ok) {
        const message = (await response.text()).trim();
        throw new Error(message || `qBittorrent request failed with status ${response.status}.`);
      }

      if (options?.parseJson === false) {
        return (await response.text()) as T;
      }

      return (await response.json()) as T;
    },
  };
}

async function listTorrentInfos(session: QbSession): Promise<QbTorrentInfo[]> {
  return session.request<QbTorrentInfo[]>("api/v2/torrents/info");
}

async function getTorrentInfo(session: QbSession, hash: string): Promise<QbTorrentInfo> {
  const normalizedHash = hash.trim().toLowerCase();
  const torrents = await listTorrentInfos(session);
  const matched = torrents.find((torrent) => torrent.hash.trim().toLowerCase() === normalizedHash);

  if (!matched) {
    throw new Error("Torrent not found.");
  }

  return matched;
}

async function listTorrentFiles(session: QbSession, hash: string): Promise<QbTorrentFile[]> {
  const params = new URLSearchParams({ hash });
  return session.request<QbTorrentFile[]>(`api/v2/torrents/files?${params.toString()}`);
}

async function setTorrentSequentialDownload(
  session: QbSession,
  hash: string,
  desiredValue: boolean,
): Promise<void> {
  const info = await getTorrentInfo(session, hash);

  if (Boolean(info.seq_dl) === desiredValue) {
    return;
  }

  const body = new URLSearchParams({ hashes: hash });
  await session.request(
    "api/v2/torrents/toggleSequentialDownload",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body: body.toString(),
    },
    { parseJson: false },
  ).catch((error) => {
    if (error instanceof Error && /Not Found/i.test(error.message)) {
      console.info("[seedbox] sequential download toggle unavailable, continuing", { hash });
      return "";
    }

    throw error;
  });
}

async function setTorrentActiveState(
  session: QbSession,
  hash: string,
  active: boolean,
): Promise<void> {
  const primaryEndpoint = active ? "api/v2/torrents/start" : "api/v2/torrents/stop";
  const fallbackEndpoint = active ? "api/v2/torrents/resume" : "api/v2/torrents/pause";
  const body = new URLSearchParams({ hashes: hash }).toString();

  try {
    await session.request(
      primaryEndpoint,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        body,
      },
      { parseJson: false },
    );
  } catch (error) {
    if (!(error instanceof Error) || !/Not Found/i.test(error.message)) {
      throw error;
    }

    await session.request(
      fallbackEndpoint,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        body,
      },
      { parseJson: false },
    );
  }
}

function getSelectedFileIndex(files: QbTorrentFile[]): number | undefined {
  const selected = files.filter((file) => file.priority > 0);
  return selected.length === 1 ? selected[0]?.index : undefined;
}

export async function getSeedboxSnapshot(): Promise<SeedboxSnapshot> {
  const session = await createSession();
  const [clientVersion, torrentInfos] = await Promise.all([
    session.request<string>("api/v2/app/version", undefined, { parseJson: false }),
    listTorrentInfos(session),
  ]);

  const torrents = torrentInfos.map(normalizeTorrentSummary);
  torrents.sort((left, right) => right.progress - left.progress);

  return {
    clientVersion,
    torrents,
  };
}

export async function getTorrentHashes(): Promise<string[]> {
  const session = await createSession();
  const torrents = await listTorrentInfos(session);
  return torrents.map((torrent) => torrent.hash);
}

export async function addMagnetLink(magnetLink: string): Promise<void> {
  const normalizedMagnet = magnetLink.trim();

  if (!normalizedMagnet.startsWith("magnet:?")) {
    throw new Error("Invalid magnet link.");
  }

  const session = await createSession();
  const form = new FormData();
  form.append("urls", normalizedMagnet);
  form.append("paused", "true");
  form.append("root_folder", "true");
  form.append("sequentialDownload", "true");
  form.append("firstLastPiecePrio", "true");

  await session.request(
    "api/v2/torrents/add",
    {
      method: "POST",
      body: form,
    },
    { parseJson: false },
  );
}

export async function stopTorrentAndClearSelection(hash: string): Promise<void> {
  const session = await createSession();
  const files = await listTorrentFiles(session, hash);

  if (files.length) {
    const ids = files.map((file) => String(file.index)).join("|");
    const body = new URLSearchParams({
      hash,
      id: ids,
      priority: "0",
    });

    await session.request(
      "api/v2/torrents/filePrio",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        body: body.toString(),
      },
      { parseJson: false },
    );
  }

  await Promise.all([
    setTorrentSequentialDownload(session, hash, false),
  ]);

  await setTorrentActiveState(session, hash, false);
}

export async function waitForTorrentMetadata(
  hash: string,
  options: { timeoutMs?: number; pollMs?: number } = {},
): Promise<TorrentDetails | null> {
  const timeoutMs = options.timeoutMs ?? 30_000;
  const pollMs = options.pollMs ?? 1_000;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const details = await getTorrentDetails(hash).catch(() => null);
    if (details?.files.length) {
      return details;
    }

    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }

  return null;
}

export async function getTorrentDetails(hash: string): Promise<TorrentDetails> {
  const session = await createSession();
  const [info, rawFiles] = await Promise.all([getTorrentInfo(session, hash), listTorrentFiles(session, hash)]);
  const summary = normalizeTorrentSummary(info);
  const basePath = info.content_path?.trim() || info.save_path?.trim() || "";
  const directoryBase = info.save_path?.trim() || basePath;
  const isMultiFile = rawFiles.length > 1;
  const selectedFileIndex = getSelectedFileIndex(rawFiles);

  const files = rawFiles.map((file) => {
    const progress = Math.max(0, Math.min(100, Math.round(file.progress * 100)));
    const sizeChunks = toChunkCount(file.size);
    const completedChunks = getCompletedChunks(file.size, progress, sizeChunks);
    const path = file.name;
    const rootFolderName = getFinalPathSegment(basePath);
    const pathIncludesRootFolder =
      Boolean(rootFolderName) &&
      (path === rootFolderName || path.startsWith(`${rootFolderName}/`));
    const absolutePath = isMultiFile
      ? pathIncludesRootFolder
        ? joinPath(directoryBase, path)
        : joinPath(basePath, path)
      : basePath;
    const extension = getExtension(path);
    const sourceUrl = buildSeedboxHttpUrl(absolutePath, directoryBase, path);

    return {
      index: file.index,
      path,
      absolutePath,
      sizeBytes: file.size,
      completedChunks,
      sizeChunks,
      progress,
      extension,
      priority: file.priority,
      createQueued: file.priority > 0,
      isPlayableVideo: isPlayableVideoExtension(extension),
      isSubtitle: isSubtitleExtension(extension),
      sourceUrl,
      streamUrl: sourceUrl ? buildSeedboxStreamProxyUrl(sourceUrl) : undefined,
    };
  });

  return {
    ...summary,
    basePath,
    directoryBase,
    isMultiFile,
    selectedFileIndex,
    files,
  };
}

export async function selectOnlyTorrentFile(hash: string, fileIndex: number): Promise<void> {
  const session = await createSession();
  const files = await listTorrentFiles(session, hash);

  if (!files.some((file) => file.index === fileIndex)) {
    throw new Error("Requested file index does not exist in this torrent.");
  }

  const body = new URLSearchParams({
    hash,
    id: files.map((file) => String(file.index)).join("|"),
    priority: "0",
  });

  await session.request(
    "api/v2/torrents/filePrio",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body: body.toString(),
    },
    { parseJson: false },
  );

  await session.request(
    "api/v2/torrents/filePrio",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body: new URLSearchParams({
        hash,
        id: String(fileIndex),
        priority: "7",
      }).toString(),
    },
    { parseJson: false },
  );

  await Promise.all([
    setTorrentSequentialDownload(session, hash, true),
  ]);

  await setTorrentActiveState(session, hash, true);
}

export async function getStreamPreparationStatus(hash: string, fileIndex: number): Promise<StreamPreparationStatus> {
  const details = await getTorrentDetails(hash);
  const file = details.files.find((entry) => entry.index === fileIndex);

  if (!file) {
    throw new Error("Requested file index does not exist in this torrent.");
  }

  const downloadedBytes = estimateDownloadedBytes(file);
  const requiredBytes = Math.min(file.sizeBytes || 0, getRequiredStreamBufferBytes(file.sizeBytes || 0));
  const progress = file.progress;

  if (!file.sourceUrl) {
    return {
      hash,
      fileIndex,
      ready: false,
      progress,
      downloadedBytes,
      requiredBytes,
      message: "No HTTP source is available for this file yet.",
    };
  }

  if (downloadedBytes < requiredBytes && progress < 100) {
    return {
      hash,
      fileIndex,
      ready: false,
      progress,
      downloadedBytes,
      requiredBytes,
      message: `Buffering stream... ${progress}% ready`,
    };
  }

  const upstream = await fetch(file.sourceUrl, {
    headers: {
      Authorization: `Basic ${buildSeedboxBasicAuth()}`,
      Range: "bytes=0-65535",
    },
    signal: AbortSignal.timeout(4_000),
  }).catch(() => null);

  const ready = Boolean(upstream && (upstream.status === 200 || upstream.status === 206));

  if (upstream?.body) {
    await upstream.body.cancel().catch(() => {});
  }

  return {
    hash,
    fileIndex,
    ready,
    progress,
    downloadedBytes,
    requiredBytes,
    message: ready ? "Stream is ready." : "Waiting for the opening segment to become readable...",
  };
}
