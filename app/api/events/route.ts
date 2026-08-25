import { createEvent, listEvents } from "@/lib/wisal-data";
import { getCurrentOwnerEmail } from "@/lib/current-owner";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json({ events: await listEvents(await getCurrentOwnerEmail()) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر تحميل المناسبات";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const validDate =
      /^\d{4}-\d{2}-\d{2}(T.*)?$/.test(payload.eventDate ?? "") &&
      !Number.isNaN(new Date(payload.eventDate).getTime());
    if (!payload.brideName?.trim() || !payload.groomName?.trim() || !validDate) {
      return Response.json({ error: "أسماء العروسين وتاريخ الحفل مطلوبة" }, { status: 400 });
    }
    const event = await createEvent(await getCurrentOwnerEmail(), payload);
    return Response.json(event, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر إنشاء المناسبة";
    return Response.json({ error: message }, { status: 500 });
  }
}
