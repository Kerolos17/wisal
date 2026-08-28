import { getCurrentOwnerEmail } from "@/lib/current-owner";
import { deleteEventSegment, updateEventSegment } from "@/lib/wisal-data";
import { apiErrorResponse } from "@/lib/api-error";
import { readJsonBody } from "@/lib/request-validation";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; segmentId: string }> }) {
  try {
    const { id, segmentId } = await params;
    const payload = await readJsonBody(request);
    if (payload.startsAt && Number.isNaN(new Date(payload.startsAt).getTime())) return Response.json({ error: "موعد المرحلة غير صالح" }, { status: 400 });
    const event = await updateEventSegment(await getCurrentOwnerEmail(), id, segmentId, payload);
    return event ? Response.json(event) : Response.json({ error: "المناسبة أو المرحلة غير موجودة" }, { status: 404 });
  } catch (error) {
    return apiErrorResponse(error, { message: "تعذر تعديل المرحلة" });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; segmentId: string }> }) {
  try {
    const { id, segmentId } = await params;
    const event = await deleteEventSegment(await getCurrentOwnerEmail(), id, segmentId);
    return event ? Response.json(event) : Response.json({ error: "المناسبة أو المرحلة غير موجودة" }, { status: 404 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("مرحلة واحدة")) {
      return apiErrorResponse(error, { message: "تعذر حذف المرحلة", status: 400, publicMessages: [error.message] });
    }
    return apiErrorResponse(error, { message: "تعذر حذف المرحلة" });
  }
}
