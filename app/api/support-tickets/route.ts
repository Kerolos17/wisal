import { getCurrentOwnerEmail } from "@/lib/current-owner";
import { createSupportTicket, listMySupportTickets } from "@/lib/support-data";
import { apiErrorResponse } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export async function GET() {
  try { return Response.json({ tickets: await listMySupportTickets(await getCurrentOwnerEmail()) }); }
  catch (error) { return apiErrorResponse(error, { message: "Unable to load support tickets" }); }
}

export async function POST(request: Request) {
  try { return Response.json({ ticket: await createSupportTicket(await getCurrentOwnerEmail(), await request.json()) }, { status: 201 }); }
  catch (error) { return apiErrorResponse(error, { message: "Unable to create support ticket", status: 400, publicMessages: ["Invalid support ticket", "Invalid support ticket options", "Event unavailable"] }); }
}
