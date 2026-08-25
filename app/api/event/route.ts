import { getEventOverview } from "@/lib/wisal-data";
import { getCurrentOwnerEmail } from "@/lib/current-owner";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await getEventOverview(undefined, await getCurrentOwnerEmail()));
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر تحميل بيانات المناسبة";
    return Response.json({ error: message }, { status: 500 });
  }
}
