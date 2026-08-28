import { updatePlatformTemplate } from "@/lib/admin-data";
import { forbiddenUnless } from "@/lib/admin-auth";
import { apiErrorResponse } from "@/lib/api-error";
import { readJsonBody } from "@/lib/request-validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const forbidden = await forbiddenUnless("templates.manage"); if (forbidden) return forbidden;
    const { code } = await params;
    const payload = await readJsonBody(request) as { active?: unknown };
    if (typeof payload.active !== "boolean") return Response.json({ error: "active must be boolean" }, { status: 400 });
    const template = await updatePlatformTemplate(code, payload.active);
    return template ? Response.json({ template }) : Response.json({ error: "Template not found" }, { status: 404 });
  } catch (error) {
    return apiErrorResponse(error, { message: "Unable to update template" });
  }
}
