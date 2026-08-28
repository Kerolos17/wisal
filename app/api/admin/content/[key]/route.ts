import { updatePlatformContent } from "@/lib/admin-data";
import { forbiddenUnless } from "@/lib/admin-auth";
import { apiErrorResponse } from "@/lib/api-error";
import { readJsonBody } from "@/lib/request-validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ key: string }> }) {
  try {
    const forbidden = await forbiddenUnless("content.manage"); if (forbidden) return forbidden;
    const { key } = await params;
    const body = await readJsonBody(request) as { valueAr?: unknown; valueEn?: unknown };
    if (typeof body.valueAr !== "string" || typeof body.valueEn !== "string" || !body.valueAr.trim() || !body.valueEn.trim()) return Response.json({ error: "Both translations are required" }, { status: 400 });
    const content = await updatePlatformContent(key, body.valueAr.trim(), body.valueEn.trim());
    return content ? Response.json({ content }) : Response.json({ error: "Content not found" }, { status: 404 });
  } catch (error) { return apiErrorResponse(error, { message: "Unable to update content" }); }
}
