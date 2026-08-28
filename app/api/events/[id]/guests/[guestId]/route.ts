import { getCurrentOwnerEmail } from "@/lib/current-owner";
import { deleteGuest, updateGuest } from "@/lib/wisal-data";
import { apiErrorResponse } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; guestId: string }> }) {
  try {
    const { id, guestId } = await params;
    const payload = await request.json();
    if (payload.phone && !/^[+\d\s()-]{7,30}$/.test(payload.phone)) return Response.json({ error: "رقم واتساب غير صالح" }, { status: 400 });
    const event = await updateGuest(await getCurrentOwnerEmail(), id, guestId, payload);
    return event ? Response.json(event) : Response.json({ error: "المناسبة أو الضيف غير موجود" }, { status: 404 });
  } catch (error) {
    return apiErrorResponse(error, { message: "تعذر تعديل الضيف" });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; guestId: string }> }) {
  try {
    const { id, guestId } = await params;
    const event = await deleteGuest(await getCurrentOwnerEmail(), id, guestId);
    return event ? Response.json(event) : Response.json({ error: "المناسبة أو الضيف غير موجود" }, { status: 404 });
  } catch (error) {
    return apiErrorResponse(error, { message: "تعذر حذف الضيف" });
  }
}
