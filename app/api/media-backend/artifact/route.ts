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
    const contentType = response.headers.get("content-type");
    if (contentType) {
      headers.set("content-type", contentType);
    }

    return new NextResponse(response.body, {
      status: 200,
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
