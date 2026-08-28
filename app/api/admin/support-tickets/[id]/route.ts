import { forbiddenUnless } from "@/lib/admin-auth";
import { getCurrentOwnerEmail } from "@/lib/current-owner";
import { updateSupportTicket } from "@/lib/support-data";
import { apiErrorResponse } from "@/lib/api-error";
import { readJsonBody } from "@/lib/request-validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const forbidden = await forbiddenUnless("support.manage"); if (forbidden) return forbidden;
    const { id } = await params;
    const ticket = await updateSupportTicket(await getCurrentOwnerEmail(), id, await readJsonBody(request));
    return ticket ? Response.json(ticket) : Response.json({ error: "Ticket not found" }, { status: 404 });
  } catch (error) { return apiErrorResponse(error, { message: "Unable to update support ticket", status: 400, publicMessages: ["Invalid ticket update"] }); }
}
