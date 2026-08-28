import { getPublicPlatformConfig } from "@/lib/admin-data";

export const dynamic = "force-dynamic";
export async function GET() {
  try { return Response.json(await getPublicPlatformConfig(), { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } }); }
  catch (error) {
    const requestId = crypto.randomUUID();
    console.error("platform_content_failed", { requestId, errorName: error instanceof Error ? error.name : "UnknownError" });
    return Response.json(
      { error: "Unable to load platform content", requestId },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
