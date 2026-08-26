import { getEventOverview } from "@/lib/wisal-data";
import { getCurrentOwnerEmail, ownerApiError } from "@/lib/current-owner";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await getEventOverview(undefined, await getCurrentOwnerEmail()));
  } catch (error) {
    return ownerApiError(error, "تعذر تحميل بيانات المناسبة");
  }
}
