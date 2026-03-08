import { type NextRequest, NextResponse } from "next/server";
import { getSeedboxConfig } from "@/lib/seedbox/config";

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

/**
 * Proxy route for seedbox file streaming.
 * Accepts ?url=<base64-encoded seedbox URL>
 * Verifies the URL belongs to the configured seedbox base, then proxies with Basic Auth.
 * Supports Range requests so the video player can seek.
 */
export async function GET(req: NextRequest) {
  const config = getSeedboxConfig();

  if (!config?.httpBaseUrl) {
    return NextResponse.json({ error: "Seedbox HTTP not configured" }, { status: 503 });
  }

  const encoded = req.nextUrl.searchParams.get("url");
  if (!encoded) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  let targetUrl: string;
  try {
    targetUrl = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return NextResponse.json({ error: "Invalid url param" }, { status: 400 });
  }

  // Verify it points to our configured seedbox — prevent open proxy abuse
  const base = config.httpBaseUrl.replace(/\/?$/, "/");
  if (!targetUrl.startsWith(base)) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 403 });
  }

  const auth = Buffer.from(`${config.httpUsername}:${config.httpPassword}`).toString("base64");

  const upstream = await fetch(targetUrl, {
    headers: {
      Authorization: `Basic ${auth}`,
      // Forward Range header so seeking works
      ...(req.headers.get("range") ? { Range: req.headers.get("range")! } : {}),
    },
  });

  const responseHeaders = new Headers();
  // Forward content headers
  for (const h of ["content-type", "content-length", "content-range", "accept-ranges", "last-modified", "etag"]) {
    const v = upstream.headers.get(h);
    if (v) responseHeaders.set(h, v);
  }
  const contentType = responseHeaders.get("content-type");
  if (!contentType || contentType === "application/octet-stream") {
    responseHeaders.set("content-type", getFallbackContentType(targetUrl));
  }
  const filename = getFilename(targetUrl);
  if (filename) {
    responseHeaders.set("content-disposition", `inline; filename*=UTF-8''${encodeURIComponent(filename)}`);
  } else {
    responseHeaders.set("content-disposition", "inline");
  }
  // Ensure the browser knows we accept ranges
  responseHeaders.set("accept-ranges", "bytes");

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
