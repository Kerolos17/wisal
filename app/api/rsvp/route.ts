import { saveRsvp } from "@/lib/wisal-data";
import { guardPublicJsonRequest, publicJson } from "@/lib/public-api-guard";
import { apiErrorResponse } from "@/lib/api-error";
import { readJsonBody } from "@/lib/request-validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const blocked = await guardPublicJsonRequest(request, { limit: 10, maxBodyBytes: 16_384 });
  if (blocked) return blocked;
  try {
    const payload = await readJsonBody(request) as {
      name?: string;
      status?: "yes" | "maybe" | "no";
      partySize?: number;
      meal?: string;
      message?: string;
      eventId?: string;
      inviteToken?: string;
      segmentResponses?: Array<{ segmentId: string; status: "yes" | "maybe" | "no"; partySize: number }>;
    };
    const name = payload.name?.trim() ?? "";
    const eventId = payload.eventId?.trim() ?? "";
    const allowedStatuses = ["yes", "maybe", "no"];
    if (name.length < 2) return publicJson({ error: "الاسم مطلوب" }, { status: 400 });
    if (!eventId) return publicJson({ error: "المناسبة مطلوبة" }, { status: 400 });
    if (!payload.status || !allowedStatuses.includes(payload.status)) return publicJson({ error: "اختيار الحضور غير صالح" }, { status: 400 });
    const partySize = Math.min(10, Math.max(1, Number(payload.partySize) || 1));
    const segmentResponses = Array.isArray(payload.segmentResponses) ? payload.segmentResponses.filter((response) => response?.segmentId && allowedStatuses.includes(response.status)).map((response) => ({ ...response, partySize: Math.min(10, Math.max(1, Number(response.partySize) || 1)) })) : [];
    const guest = await saveRsvp({ eventId, inviteToken: payload.inviteToken?.trim(), name, status: payload.status, partySize, meal: payload.meal?.trim() || "—", message: payload.message?.trim(), segmentResponses });
    return publicJson({ guest }, { status: 201 });
  } catch (error) {
    const publicMessages = ["المناسبة مطلوبة", "تأكيد الحضور غير متاح لهذه الدعوة", "انتهى موعد تأكيد الحضور", "رابط الدعوة الشخصي غير صالح", "هذه الدعوة الخاصة تحتاج رابط ضيف صالح", "إحدى مراحل المناسبة غير صالحة", "لا تملك هذه الدعوة صلاحية الرد على إحدى المراحل", "هذا الاسم مسجل بالفعل، استخدم رابط الدعوة الشخصي"];
    const errorCode = typeof error === "object" && error !== null && "code" in error ? (error as { code?: unknown }).code : undefined;
    if (errorCode === "GUEST_LIMIT" || errorCode === "RSVP_NAME_CONFLICT") {
      return apiErrorResponse(error, { message: "تعذر حفظ الرد", status: 409, messageByCode: { GUEST_LIMIT: "تجاوزت الدعوة الحد الأقصى للضيوف في باقتك", RSVP_NAME_CONFLICT: "هذا الاسم مسجل بالفعل، استخدم رابط الدعوة الشخصي" } });
    }
    if (error instanceof Error && publicMessages.includes(error.message)) {
      return apiErrorResponse(error, { message: "تعذر حفظ الرد", status: 400, publicMessages, messageByCode: { GUEST_LIMIT: "تجاوزت الدعوة الحد الأقصى للضيوف في باقتك", RSVP_NAME_CONFLICT: "هذا الاسم مسجل بالفعل، استخدم رابط الدعوة الشخصي" }, statusByCode: { GUEST_LIMIT: 409, RSVP_NAME_CONFLICT: 409 } });
    }
    return apiErrorResponse(error, { message: "تعذر حفظ الرد" });
  }
}
