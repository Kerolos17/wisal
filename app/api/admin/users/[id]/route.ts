import { updateUserRole } from "@/lib/admin-data";
import { forbiddenUnless } from "@/lib/admin-auth";
import { apiErrorResponse } from "@/lib/api-error";
import { readJsonBody } from "@/lib/request-validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const forbidden = await forbiddenUnless("users.manage"); if (forbidden) return forbidden;
    const { id } = await params;
    const { role } = await readJsonBody(request) as { role?: unknown };
    if (typeof role !== "string") return Response.json({ error: "role must be a string" }, { status: 400 });
    const user = await updateUserRole(id, role);
    return user ? Response.json({ user }) : Response.json({ error: "User not found" }, { status: 404 });
  } catch (error) {
    if (error instanceof Error && ["Invalid role", "The platform owner must remain an admin"].includes(error.message)) {
      return apiErrorResponse(error, { message: "Unable to update role", status: 400, publicMessages: [error.message] });
    }
    return apiErrorResponse(error, { message: "Unable to update role" });
  }
}
