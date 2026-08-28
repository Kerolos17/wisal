import { getCurrentOwnerEmail } from "@/lib/current-owner";
import { createGuestGroup } from "@/lib/wisal-data";
import { apiErrorResponse } from "@/lib/api-error";
import { readJsonBody } from "@/lib/request-validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payload = await readJsonBody(request);
    if (!payload.name?.trim()) return Response.json({ error: "اسم الفئة مطلوب" }, { status: 400 });
    if (!Array.isArray(payload.guestIds) || !Array.isArray(payload.segmentIds)) return Response.json({ error: "قائمة الضيوف والمراحل مطلوبة" }, { status: 400 });
    if (!payload.segmentIds.length) return Response.json({ error: "اختر مرحلة واحدة على الأقل" }, { status: 400 });
    const event = await createGuestGroup(await getCurrentOwnerEmail(), id, payload as Parameters<typeof createGuestGroup>[2]);
    return event ? Response.json(event, { status: 201 }) : Response.json({ error: "المناسبة غير موجودة" }, { status: 404 });
  } catch (error) {
    return apiErrorResponse(error, { message: "تعذر إضافة الفئة", messageByCode: { "23505": "اسم الفئة مستخدم بالفعل" }, statusByCode: { "23505": 409 } });
  }
}
