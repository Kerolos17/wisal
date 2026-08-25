import { getCurrentOwnerEmail } from "@/lib/current-owner";
import { getEventOverview, updateEvent } from "@/lib/wisal-data";
import { getBucket } from "@/lib/wisal-storage";

export const dynamic = "force-dynamic";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ownerEmail = await getCurrentOwnerEmail();
    const event = await getEventOverview(id, ownerEmail);
    if (!event) return Response.json({ error: "المناسبة غير موجودة" }, { status: 404 });
    const form = await request.formData();
    const file = form.get("cover");
    if (!(file instanceof File) || !allowedTypes.has(file.type)) return Response.json({ error: "اختر صورة JPG أو PNG أو WebP" }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return Response.json({ error: "حجم الصورة يجب ألا يتجاوز 5MB" }, { status: 400 });
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const key = `covers/${id}/${crypto.randomUUID()}.${extension}`;
    await getBucket().put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
    const previousKey = event.invitation.coverImageKey;
    const updated = await updateEvent(ownerEmail, id, { coverImageKey: key });
    if (previousKey) await getBucket().delete(previousKey);
    return Response.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر رفع صورة الغلاف";
    return Response.json({ error: message }, { status: 500 });
  }
}
