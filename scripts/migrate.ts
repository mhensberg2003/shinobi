/**
 * Run once against Neon to create auth tables.
 * Usage: npx tsx scripts/migrate.ts
 * Requires DATABASE_URL in .env.local or environment.
 */

import { readFileSync, existsSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

// Load .env.local if present
const envPath = new URL("../.env.local", import.meta.url).pathname;
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = val;
  }
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function migrate() {
  console.log("Running migration…");

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username     TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at)`;

  await sql`
    CREATE TABLE IF NOT EXISTS watch_sessions (
      session_key       TEXT PRIMARY KEY,
      magnet_link       TEXT NOT NULL DEFAULT '',
      file_index        INTEGER NOT NULL DEFAULT -1,
      torrent_hash      TEXT,
      source_provider   TEXT,
      source_id         TEXT,
      source_link       TEXT,
      source_url        TEXT,
      title             TEXT,
      poster_url        TEXT,
      episode_number    INTEGER,
      episode_total     INTEGER,
      progress_seconds  DOUBLE PRECISION,
      duration_seconds  DOUBLE PRECISION,
      active_in_player  BOOLEAN NOT NULL DEFAULT FALSE,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      cleanup_after     TIMESTAMPTZ NOT NULL,
      removed_at        TIMESTAMPTZ
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS watch_sessions_cleanup_after_idx ON watch_sessions(cleanup_after)`;
  await sql`CREATE INDEX IF NOT EXISTS watch_sessions_updated_at_idx ON watch_sessions(updated_at DESC)`;

  console.log("Migration complete.");
  console.log("");
  console.log("Create your first user:");
  console.log("  npx tsx scripts/create-user.ts <username> <password>");
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
