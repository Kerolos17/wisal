import { getCurrentOwnerEmail } from "@/lib/current-owner";
import { importGuests } from "@/lib/wisal-data";
import { apiErrorResponse } from "@/lib/api-error";
import { readJsonBody } from "@/lib/request-validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payload = await readJsonBody(request) as { rows?: Array<{ name?: string; phone?: string; partySize?: number; groupId?: string | null }> };
    if (!Array.isArray(payload.rows) || !payload.rows.length) return Response.json({ error: "ملف الضيوف فارغ" }, { status: 400 });
    if (payload.rows.length > 500) return Response.json({ error: "الحد الأقصى للاستيراد 500 ضيف في المرة" }, { status: 400 });
    const rows = payload.rows.map((row) => ({ name: row.name?.trim() || "", phone: row.phone?.trim() || "", partySize: Math.max(1, Math.min(10, Number(row.partySize) || 1)), groupId: row.groupId || null }));
    if (rows.some((row) => row.phone && !/^[+\d\s()-]{7,30}$/.test(row.phone))) return Response.json({ error: "يوجد رقم واتساب غير صالح" }, { status: 400 });
    const event = await importGuests(await getCurrentOwnerEmail(), id, rows);
    return event ? Response.json(event, { status: 201 }) : Response.json({ error: "المناسبة غير موجودة" }, { status: 404 });
  } catch (error) {
    return apiErrorResponse(error, {
      message: "تعذر استيراد الضيوف",
      messageByCode: { GUEST_LIMIT: "تجاوزت الحد الأقصى للضيوف في باقتك", CONFLICT: "يتضمن الملف ضيوفًا مكررين" },
      statusByCode: { GUEST_LIMIT: 409, CONFLICT: 409 },
    });
  }
}
