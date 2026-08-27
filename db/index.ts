import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type WisalRuntime = typeof globalThis & { __WISAL_ENV__?: { DATABASE_URL?: string } };

let cached: ReturnType<typeof drizzle> | null = null;
let cachedSql: ReturnType<typeof neon> | null = null;

function connectionString() {
  const value = (globalThis as WisalRuntime).__WISAL_ENV__?.DATABASE_URL ?? process.env.DATABASE_URL;
  if (!value) throw new Error("DATABASE_URL is unavailable.");
  return value;
}

export function getDb() {
  const value = connectionString();
  if (!cached) {
    // Use neon() tagged-template client (WebSocket) — proven stable across runtimes
    cached = drizzle(neon(value), { schema });
  }
  return cached;
}

/**
 * Neon HTTP SQL client. Unlike Drizzle's neon-http session wrapper, the
 * underlying client supports non-interactive transactions via sql.transaction.
 */
export function getSql() {
  if (!cachedSql) cachedSql = neon(connectionString());
  return cachedSql;
}
