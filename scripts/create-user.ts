/**
 * Create a user in the database.
 * Usage: npx tsx scripts/create-user.ts <username> <password>
 */

import { readFileSync, existsSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

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

const [,, username, password] = process.argv;
if (!username || !password) {
  console.error("Usage: npx tsx scripts/create-user.ts <username> <password>");
  process.exit(1);
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function main() {
  const hash = await bcrypt.hash(password, 12);
  await sql`
    INSERT INTO users (username, password_hash)
    VALUES (${username}, ${hash})
    ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash
  `;
  console.log(`User "${username}" created/updated.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
