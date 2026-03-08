import { NextResponse } from "next/server";

import { requireMediaBackendConfig } from "@/lib/media-backend/config";

export async function GET(request: Request) {
  try {
    const config = requireMediaBackendConfig();
    const url = new URL(request.url).searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "Missing artifact url." }, { status: 400 });
    }

    const artifactUrl = Buffer.from(url, "base64url").toString("utf8");
    const response = await fetch(artifactUrl, {
      headers: {
        Authorization: `Bearer ${config.secret}`,
        ...(request.headers.get("range")
          ? { Range: request.headers.get("range") as string }
          : {}),
      },
      cache: "no-store",
    });

    if (!response.ok || !response.body) {
      return NextResponse.json(
        { error: `Artifact request failed with ${response.status}.` },
        { status: response.status },
      );
    }

    const headers = new Headers();
    for (const header of [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges",
      "last-modified",
      "etag",
      "cache-control",
    ]) {
      const value = response.headers.get(header);
      if (value) {
        headers.set(header, value);
      }
    }
    headers.set("accept-ranges", "bytes");

    return new NextResponse(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to proxy artifact.",
      },
      { status: 500 },
    );
  }
}
