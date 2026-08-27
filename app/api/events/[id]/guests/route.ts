import { getCurrentOwnerEmail } from "@/lib/current-owner";
import { addGuest } from "@/lib/wisal-data";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payload = await request.json();
    if (!payload.name?.trim()) return Response.json({ error: "اسم الضيف مطلوب" }, { status: 400 });
    if (payload.phone && !/^[+\d\s()-]{7,30}$/.test(payload.phone)) return Response.json({ error: "رقم واتساب غير صالح" }, { status: 400 });
    const event = await addGuest(await getCurrentOwnerEmail(), id, payload);
    return event ? Response.json(event, { status: 201 }) : Response.json({ error: "المناسبة غير موجودة" }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر إضافة الضيف";
    const code = (error as { code?: string }).code;
    const status = code === "GUEST_LIMIT" || code === "CONFLICT" ? 409 : 500;
    return Response.json({ error: message }, { status });
  }
}
