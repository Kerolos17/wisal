import { getAdminOverview } from "@/lib/admin-data";
import { forbiddenUnless } from "@/lib/admin-auth";
import { apiErrorResponse } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const forbidden = await forbiddenUnless("overview.read"); if (forbidden) return forbidden;
    return Response.json(await getAdminOverview());
  } catch (error) {
    return apiErrorResponse(error, { message: "Unable to load admin overview" });
  }
}
