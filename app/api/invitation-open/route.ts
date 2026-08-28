import { trackInvitationOpen } from "@/lib/wisal-data";
import { guardPublicJsonRequest, publicJson } from "@/lib/public-api-guard";
import { apiErrorResponse } from "@/lib/api-error";
import { readJsonBody } from "@/lib/request-validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const blocked = await guardPublicJsonRequest(request, { limit: 30, maxBodyBytes: 4_096 });
  if (blocked) return blocked;
  try {
    const payload = await readJsonBody(request) as { eventId?: string; inviteToken?: string };
    const eventId = payload.eventId?.trim() ?? "";
    const inviteToken = payload.inviteToken?.trim() ?? "";
    if (!eventId || !inviteToken) return publicJson({ error: "بيانات رابط الدعوة غير مكتملة" }, { status: 400 });
    await trackInvitationOpen(eventId, inviteToken);
    return publicJson({ tracked: true });
  } catch (error) {
    const publicMessages = ["الدعوة غير متاحة", "رابط الدعوة الشخصي غير صالح"];
    if (error instanceof Error && publicMessages.includes(error.message)) {
      return apiErrorResponse(error, { message: "تعذر تسجيل فتح الدعوة", status: 400, publicMessages });
    }
    return apiErrorResponse(error, { message: "تعذر تسجيل فتح الدعوة" });
  }
}
