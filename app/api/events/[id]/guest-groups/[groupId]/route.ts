import { getCurrentOwnerEmail } from "@/lib/current-owner";
import { deleteGuestGroup, updateGuestGroup } from "@/lib/wisal-data";
import { apiErrorResponse } from "@/lib/api-error";
import { readJsonBody } from "@/lib/request-validation";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; groupId: string }> }) {
  try {
    const { id, groupId } = await params;
    const payload = await readJsonBody(request);
    if (!payload.name?.trim()) return Response.json({ error: "اسم الفئة مطلوب" }, { status: 400 });
    if (!Array.isArray(payload.guestIds) || !Array.isArray(payload.segmentIds) || !payload.segmentIds.length) return Response.json({ error: "اختر الضيوف ومرحلة واحدة على الأقل" }, { status: 400 });
    const event = await updateGuestGroup(await getCurrentOwnerEmail(), id, groupId, payload as Parameters<typeof updateGuestGroup>[3]);
    return event ? Response.json(event) : Response.json({ error: "المناسبة أو الفئة غير موجودة" }, { status: 404 });
  } catch (error) {
    return apiErrorResponse(error, { message: "تعذر تعديل الفئة" });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; groupId: string }> }) {
  try {
    const { id, groupId } = await params;
    const event = await deleteGuestGroup(await getCurrentOwnerEmail(), id, groupId);
    return event ? Response.json(event) : Response.json({ error: "المناسبة أو الفئة غير موجودة" }, { status: 404 });
  } catch (error) {
    return apiErrorResponse(error, { message: "تعذر حذف الفئة" });
  }
}
