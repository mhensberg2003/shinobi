import { type NextRequest, NextResponse } from "next/server";

import { resolveWatchSession } from "@/lib/media-backend/client";

export const dynamic = "force-dynamic";

function getFallbackContentType(targetUrl: string): string {
  try {
    const pathname = new URL(targetUrl).pathname.toLowerCase();

    if (pathname.endsWith(".mkv")) return "video/x-matroska";
    if (pathname.endsWith(".mp4") || pathname.endsWith(".m4v")) return "video/mp4";
    if (pathname.endsWith(".webm")) return "video/webm";
    if (pathname.endsWith(".mov")) return "video/quicktime";
  } catch {}

  return "application/octet-stream";
}

function getFilename(targetUrl: string): string | null {
  try {
    const pathname = new URL(targetUrl).pathname;
    const name = pathname.split("/").at(-1);
    return name ? decodeURIComponent(name) : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const sessionKey = request.nextUrl.searchParams.get("sessionKey")?.trim();
  if (!sessionKey) {
    return NextResponse.json({ error: "sessionKey is required" }, { status: 400 });
  }

  const resolved = await resolveWatchSession(sessionKey).catch(() => null);
  const sourceUrl = resolved?.session.sourceUrl;

  if (!sourceUrl) {
    return NextResponse.json({ error: "Watch session source is unavailable" }, { status: 404 });
  }

  const upstream = await fetch(sourceUrl, {
    headers: {
      ...(request.headers.get("range") ? { Range: request.headers.get("range")! } : {}),
    },
    cache: "no-store",
  });

  const responseHeaders = new Headers();
  for (const header of [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "last-modified",
    "etag",
  ]) {
    const value = upstream.headers.get(header);
    if (value) {
      responseHeaders.set(header, value);
    }
  }

  const contentType = responseHeaders.get("content-type");
  if (!contentType || contentType === "application/octet-stream") {
    responseHeaders.set("content-type", getFallbackContentType(sourceUrl));
  }

  const filename = getFilename(sourceUrl);
  if (filename) {
    responseHeaders.set(
      "content-disposition",
      `inline; filename*=UTF-8''${encodeURIComponent(filename)}`,
    );
  } else {
    responseHeaders.set("content-disposition", "inline");
  }

  responseHeaders.set("accept-ranges", "bytes");

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
