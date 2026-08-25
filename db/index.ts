import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type WisalRuntime = typeof globalThis & { __WISAL_ENV__?: { DATABASE_URL?: string } };

export function getDb() {
  const connectionString = (globalThis as WisalRuntime).__WISAL_ENV__?.DATABASE_URL ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is unavailable.");
  return drizzle(neon(connectionString), { schema });
}
