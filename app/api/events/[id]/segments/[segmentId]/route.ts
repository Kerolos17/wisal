import { getCurrentOwnerEmail } from "@/lib/current-owner";
import { deleteEventSegment, updateEventSegment } from "@/lib/wisal-data";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; segmentId: string }> }) {
  try {
    const { id, segmentId } = await params;
    const payload = await request.json();
    if (payload.startsAt && Number.isNaN(new Date(payload.startsAt).getTime())) return Response.json({ error: "موعد المرحلة غير صالح" }, { status: 400 });
    const event = await updateEventSegment(await getCurrentOwnerEmail(), id, segmentId, payload);
    return event ? Response.json(event) : Response.json({ error: "المناسبة أو المرحلة غير موجودة" }, { status: 404 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "تعذر تعديل المرحلة" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; segmentId: string }> }) {
  try {
    const { id, segmentId } = await params;
    const event = await deleteEventSegment(await getCurrentOwnerEmail(), id, segmentId);
    return event ? Response.json(event) : Response.json({ error: "المناسبة أو المرحلة غير موجودة" }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر حذف المرحلة";
    return Response.json({ error: message }, { status: message.includes("مرحلة واحدة") ? 400 : 500 });
  }
}
