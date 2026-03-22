import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { createSession, SESSION_COOKIE } from "@/lib/auth";

const SESSION_DURATION_DAYS = 30;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const { username, password, inviteCode } = body ?? {};

  if (!username || !password || !inviteCode) {
    return NextResponse.json({ error: "Username, password, and invite code are required." }, { status: 400 });
  }

  if (username.length < 3 || username.length > 32) {
    return NextResponse.json({ error: "Username must be 3–32 characters." }, { status: 400 });
  }

  // Validate invite code
  const codes = await sql`
    SELECT code FROM invite_codes WHERE code = ${inviteCode} AND used_by IS NULL
  `;
  if (!codes.length) {
    return NextResponse.json({ error: "Invalid or already used invite code." }, { status: 400 });
  }

  // Check username taken
  const existing = await sql`SELECT id FROM users WHERE username = ${username} LIMIT 1`;
  if (existing.length) {
    return NextResponse.json({ error: "Username already taken." }, { status: 400 });
  }

  const password_hash = await bcrypt.hash(password, 12);

  const rows = await sql`
    INSERT INTO users (username, password_hash)
    VALUES (${username}, ${password_hash})
    RETURNING id
  `;
  const userId = (rows[0] as { id: string }).id;

  // Mark invite code as used
  await sql`
    UPDATE invite_codes SET used_by = ${userId}, used_at = NOW() WHERE code = ${inviteCode}
  `;

  const sessionId = await createSession(userId);
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
