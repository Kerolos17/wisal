import { getPublicPlatformConfig } from "@/lib/admin-data";

export const dynamic = "force-dynamic";
export async function GET() {
  try { return Response.json(await getPublicPlatformConfig(), { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to load content" }, { status: 500 }); }
}
