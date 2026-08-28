import { createEvent, listEvents } from "@/lib/wisal-data";
import { getCurrentOwnerEmail, ownerApiError } from "@/lib/current-owner";
import { readJsonBody } from "@/lib/request-validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json({ events: await listEvents(await getCurrentOwnerEmail()) });
  } catch (error) {
    return ownerApiError(error, "تعذر تحميل المناسبات");
  }
}

export async function POST(request: Request) {
  try {
    const payload = await readJsonBody(request);
    const validDate =
      /^\d{4}-\d{2}-\d{2}(T.*)?$/.test(payload.eventDate ?? "") &&
      !Number.isNaN(new Date(payload.eventDate).getTime());
    if (!payload.brideName?.trim() || !payload.groomName?.trim() || !validDate) {
      return Response.json({ error: "أسماء العروسين وتاريخ الحفل مطلوبة" }, { status: 400 });
    }
    const event = await createEvent(await getCurrentOwnerEmail(), payload as Parameters<typeof createEvent>[1]);
    return Response.json(event, { status: 201 });
  } catch (error) {
    return ownerApiError(error, "تعذر إنشاء المناسبة");
  }
}
