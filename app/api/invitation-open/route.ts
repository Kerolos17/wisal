import { trackInvitationOpen } from "@/lib/wisal-data";
import { guardPublicJsonRequest, publicJson } from "@/lib/public-api-guard";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const blocked = await guardPublicJsonRequest(request, { limit: 30, maxBodyBytes: 4_096 });
  if (blocked) return blocked;
  try {
    const payload = await request.json() as { eventId?: string; inviteToken?: string };
    const eventId = payload.eventId?.trim() ?? "";
    const inviteToken = payload.inviteToken?.trim() ?? "";
    if (!eventId || !inviteToken) return publicJson({ error: "بيانات رابط الدعوة غير مكتملة" }, { status: 400 });
    await trackInvitationOpen(eventId, inviteToken);
    return publicJson({ tracked: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر تسجيل فتح الدعوة";
    const expectedError = message === "الدعوة غير متاحة" || message === "رابط الدعوة الشخصي غير صالح";
    return publicJson({ error: message }, { status: expectedError ? 400 : 500 });
  }
}
