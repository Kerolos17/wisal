import { sql } from "drizzle-orm";
import { getDb } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const checkedAt = new Date().toISOString();
  try {
    await getDb().execute(sql`select 1 as healthy`);
    return Response.json(
      { status: "ok", services: { application: "ok", database: "ok" }, checkedAt },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { status: "degraded", services: { application: "ok", database: "unavailable" }, checkedAt },
      { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "30" } },
    );
  }
}
