import { getCurrentOwnerEmail } from "@/lib/current-owner";
import { addGuest } from "@/lib/wisal-data";
import { apiErrorResponse } from "@/lib/api-error";
import { readJsonBody } from "@/lib/request-validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payload = await readJsonBody(request);
    if (!payload.name?.trim()) return Response.json({ error: "اسم الضيف مطلوب" }, { status: 400 });
    if (payload.phone && !/^[+\d\s()-]{7,30}$/.test(payload.phone)) return Response.json({ error: "رقم واتساب غير صالح" }, { status: 400 });
    const event = await addGuest(await getCurrentOwnerEmail(), id, payload as Parameters<typeof addGuest>[2]);
    return event ? Response.json(event, { status: 201 }) : Response.json({ error: "المناسبة غير موجودة" }, { status: 404 });
  } catch (error) {
    return apiErrorResponse(error, {
      message: "تعذر إضافة الضيف",
      messageByCode: { GUEST_LIMIT: "تجاوزت الحد الأقصى للضيوف في باقتك", CONFLICT: "الضيف موجود بالفعل" },
      statusByCode: { GUEST_LIMIT: 409, CONFLICT: 409 },
    });
  }
}
