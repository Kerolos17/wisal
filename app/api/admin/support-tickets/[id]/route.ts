import { forbiddenUnless } from "@/lib/admin-auth";
import { getCurrentOwnerEmail } from "@/lib/current-owner";
import { updateSupportTicket } from "@/lib/support-data";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const forbidden = await forbiddenUnless("support.manage"); if (forbidden) return forbidden;
    const { id } = await params;
    const ticket = await updateSupportTicket(await getCurrentOwnerEmail(), id, await request.json());
    return ticket ? Response.json(ticket) : Response.json({ error: "Ticket not found" }, { status: 404 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to update support ticket" }, { status: 400 }); }
}
