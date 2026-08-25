import { getCurrentOwnerEmail } from "@/lib/current-owner";
import { getEventOverview, updateEvent } from "@/lib/wisal-data";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const event = await getEventOverview(id, await getCurrentOwnerEmail());
    return event ? Response.json(event) : Response.json({ error: "المناسبة غير موجودة" }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر تحميل المناسبة";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payload = await request.json();
    if (payload.eventDate && Number.isNaN(new Date(payload.eventDate).getTime())) return Response.json({ error: "تاريخ الحفل غير صالح" }, { status: 400 });
    if (payload.status && !["draft", "published", "archived"].includes(payload.status)) return Response.json({ error: "حالة المناسبة غير صالحة" }, { status: 400 });
    if (payload.openingStyle && !["envelope", "card", "curtain"].includes(payload.openingStyle)) return Response.json({ error: "أسلوب فتح الدعوة غير صالح" }, { status: 400 });
    if (payload.layoutStyle && !["classic", "story", "cinematic"].includes(payload.layoutStyle)) return Response.json({ error: "تخطيط الدعوة غير صالح" }, { status: 400 });
    if (payload.sectionOrder && (!Array.isArray(payload.sectionOrder) || payload.sectionOrder.length !== 4 || new Set(payload.sectionOrder).size !== 4 || !payload.sectionOrder.every((section: unknown) => typeof section === "string" && ["message", "countdown", "schedule", "rsvp"].includes(section)))) return Response.json({ error: "ترتيب أقسام الدعوة غير صالح" }, { status: 400 });
    const ownerEmail = await getCurrentOwnerEmail();
    if (payload.status === "published") {
      const current = await getEventOverview(id, ownerEmail);
      if (!current) return Response.json({ error: "المناسبة غير موجودة" }, { status: 404 });
      const required = {
        brideName: payload.brideName ?? current.event.brideName,
        groomName: payload.groomName ?? current.event.groomName,
        eventDate: payload.eventDate ?? current.event.eventDate,
        venue: payload.venue ?? current.event.venue,
        city: payload.city ?? current.event.city,
      };
      if (
        !required.brideName?.trim() ||
        !required.groomName?.trim() ||
        !required.venue?.trim() ||
        !required.city?.trim() ||
        Number.isNaN(new Date(required.eventDate).getTime())
      ) {
        return Response.json({ error: "أكمل الأسماء والموعد والمكان والمدينة قبل نشر الدعوة" }, { status: 400 });
      }
    }
    const event = await updateEvent(ownerEmail, id, payload);
    return event ? Response.json(event) : Response.json({ error: "المناسبة غير موجودة" }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر حفظ التغييرات";
    return Response.json({ error: message }, { status: 500 });
  }
}
