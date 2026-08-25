import { getAdminOverview } from "@/lib/admin-data";
import { forbiddenUnless } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const forbidden = await forbiddenUnless("overview.read"); if (forbidden) return forbidden;
    return Response.json(await getAdminOverview());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load admin overview" }, { status: 500 });
  }
}
