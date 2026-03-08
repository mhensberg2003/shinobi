import { NextResponse } from "next/server";

import { getWatchSession } from "@/lib/media-backend/client";
import { getMediaBackendConfig } from "@/lib/media-backend/config";

type RouteProps = {
  params: Promise<{
    sessionKey: string;
  }>;
};

export async function GET(_: Request, { params }: RouteProps) {
  if (!getMediaBackendConfig()) {
    return NextResponse.json(
      { ok: false, error: "Media backend is not configured." },
      { status: 503 },
    );
  }

  const { sessionKey } = await params;

  if (!sessionKey?.trim()) {
    return NextResponse.json({ ok: false, error: "sessionKey is required." }, { status: 400 });
  }

  try {
    const session = await getWatchSession(sessionKey.trim());
    return NextResponse.json({ ok: true, session });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to fetch watch session.",
      },
      { status: 500 },
    );
  }
}
