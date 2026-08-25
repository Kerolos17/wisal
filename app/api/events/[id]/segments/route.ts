import { getCurrentOwnerEmail } from "@/lib/current-owner";
import { createEventSegment } from "@/lib/wisal-data";

export const dynamic = "force-dynamic";

const allowedKinds = new Set(["ceremony", "reception", "dinner", "party", "session", "other"]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payload = await request.json();
    if (!payload.title?.trim() || !payload.startsAt || !payload.venueName?.trim() || !payload.city?.trim()) {
      return Response.json({ error: "اسم المرحلة والموعد والمكان والمدينة مطلوبة" }, { status: 400 });
    }
    if (Number.isNaN(new Date(payload.startsAt).getTime())) return Response.json({ error: "موعد المرحلة غير صالح" }, { status: 400 });
    if (!allowedKinds.has(payload.kind)) return Response.json({ error: "نوع المرحلة غير صالح" }, { status: 400 });
    const event = await createEventSegment(await getCurrentOwnerEmail(), id, payload);
    return event ? Response.json(event, { status: 201 }) : Response.json({ error: "المناسبة غير موجودة" }, { status: 404 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "تعذر إضافة المرحلة" }, { status: 500 });
  }
}
