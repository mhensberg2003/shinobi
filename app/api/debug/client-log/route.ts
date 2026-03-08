import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      scope?: string;
      message?: string;
      details?: Record<string, unknown>;
    };

    console.info("[shinobi:client-debug]", {
      scope: body.scope ?? "unknown",
      message: body.message ?? "",
      details: body.details ?? {},
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
