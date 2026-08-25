import { saveRsvp } from "@/lib/wisal-data";
import { guardPublicJsonRequest, publicJson } from "@/lib/public-api-guard";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const blocked = await guardPublicJsonRequest(request, { limit: 10, maxBodyBytes: 16_384 });
  if (blocked) return blocked;
  try {
    const payload = await request.json() as {
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
    const allowedStatuses = ["yes", "maybe", "no"];
    if (name.length < 2) return publicJson({ error: "الاسم مطلوب" }, { status: 400 });
    if (!payload.status || !allowedStatuses.includes(payload.status)) return publicJson({ error: "اختيار الحضور غير صالح" }, { status: 400 });
    const partySize = Math.min(10, Math.max(1, Number(payload.partySize) || 1));
    const segmentResponses = Array.isArray(payload.segmentResponses) ? payload.segmentResponses.filter((response) => response?.segmentId && allowedStatuses.includes(response.status)).map((response) => ({ ...response, partySize: Math.min(10, Math.max(1, Number(response.partySize) || 1)) })) : [];
    const guest = await saveRsvp({ eventId: payload.eventId, inviteToken: payload.inviteToken?.trim(), name, status: payload.status, partySize, meal: payload.meal?.trim() || "—", message: payload.message?.trim(), segmentResponses });
    return publicJson({ guest }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر حفظ الرد";
    const expectedError = message === "تأكيد الحضور غير متاح لهذه الدعوة" || message === "انتهى موعد تأكيد الحضور" || message === "رابط الدعوة الشخصي غير صالح";
    return publicJson({ error: message }, { status: expectedError ? 400 : 500 });
  }
}
