import { getCurrentOwnerEmail } from "@/lib/current-owner";
import { createGuestGroup } from "@/lib/wisal-data";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payload = await request.json();
    if (!payload.name?.trim()) return Response.json({ error: "اسم الفئة مطلوب" }, { status: 400 });
    if (!Array.isArray(payload.guestIds) || !Array.isArray(payload.segmentIds)) return Response.json({ error: "قائمة الضيوف والمراحل مطلوبة" }, { status: 400 });
    if (!payload.segmentIds.length) return Response.json({ error: "اختر مرحلة واحدة على الأقل" }, { status: 400 });
    const event = await createGuestGroup(await getCurrentOwnerEmail(), id, payload);
    return event ? Response.json(event, { status: 201 }) : Response.json({ error: "المناسبة غير موجودة" }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر إضافة الفئة";
    return Response.json({ error: message }, { status: message.includes("unique") ? 409 : 500 });
  }
}
