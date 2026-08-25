import { updateUserRole } from "@/lib/admin-data";
import { forbiddenUnless } from "@/lib/admin-auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const forbidden = await forbiddenUnless("users.manage"); if (forbidden) return forbidden;
    const { id } = await params;
    const { role } = await request.json() as { role?: unknown };
    if (typeof role !== "string") return Response.json({ error: "role must be a string" }, { status: 400 });
    const user = await updateUserRole(id, role);
    return user ? Response.json({ user }) : Response.json({ error: "User not found" }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update role";
    return Response.json({ error: message }, { status: message.includes("Invalid") || message.includes("owner") ? 400 : 500 });
  }
}
