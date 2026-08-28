import { getCurrentOwnerEmail } from "@/lib/current-owner";
import { createMessage } from "@/lib/wisal-data";
import { apiErrorResponse } from "@/lib/api-error";
import { readJsonBody } from "@/lib/request-validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payload = await readJsonBody(request);
    if (!payload.title?.trim() || !payload.body?.trim()) return Response.json({ error: "عنوان الرسالة ومحتواها مطلوبان" }, { status: 400 });
    if (payload.audience && !["all", "pending", "confirmed", "unopened", "opened_pending", "maybe", "declined"].includes(payload.audience)) return Response.json({ error: "فئة المستلمين غير صالحة" }, { status: 400 });
    const event = await createMessage(await getCurrentOwnerEmail(), id, payload as Parameters<typeof createMessage>[2]);
    return event ? Response.json(event, { status: 201 }) : Response.json({ error: "المناسبة غير موجودة" }, { status: 404 });
  } catch (error) {
    return apiErrorResponse(error, { message: "تعذر حفظ الرسالة" });
  }
}
