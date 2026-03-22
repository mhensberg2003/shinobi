import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { createSession, SESSION_COOKIE } from "@/lib/auth";

const SESSION_DURATION_DAYS = 30;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const { username, password } = body ?? {};

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password required." }, { status: 400 });
  }

  const rows = await sql`
    SELECT id, password_hash FROM users WHERE username = ${username} LIMIT 1
  `;

  if (!rows.length) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const user = rows[0] as { id: string; password_hash: string };
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const sessionId = await createSession(user.id);

  const expires = new Date();
  expires.setDate(expires.getDate() + SESSION_DURATION_DAYS);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    expires,
    path: "/",
  });

  return response;
}
