import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { randomUUID } from "@/lib/uuid";

export async function POST() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const code = randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase();
  await sql`INSERT INTO invite_codes (code) VALUES (${code})`;

  return NextResponse.json({ code });
}
