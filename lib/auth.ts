import "server-only";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";

export const SESSION_COOKIE = "shinobi_session";
const SESSION_DURATION_DAYS = 30;

export interface AuthUser {
  id: string;
  username: string;
}

export async function createSession(userId: string): Promise<string> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  const rows = await sql`
    INSERT INTO sessions (user_id, expires_at)
    VALUES (${userId}, ${expiresAt.toISOString()})
    RETURNING id
  `;

  return (rows[0] as { id: string }).id;
}

export async function getSession(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const rows = await sql`
    SELECT u.id, u.username
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.id = ${sessionId}
      AND s.expires_at > NOW()
  `;

  if (!rows.length) return null;
  const row = rows[0] as { id: string; username: string };
  return { id: row.id, username: row.username };
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return;
  await sql`DELETE FROM sessions WHERE id = ${sessionId}`;
}
