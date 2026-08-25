import { getCurrentOwnerEmail } from "@/lib/current-owner";
import { createSupportTicket, listMySupportTickets } from "@/lib/support-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try { return Response.json({ tickets: await listMySupportTickets(await getCurrentOwnerEmail()) }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to load support tickets" }, { status: 500 }); }
}

export async function POST(request: Request) {
  try { return Response.json({ ticket: await createSupportTicket(await getCurrentOwnerEmail(), await request.json()) }, { status: 201 }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to create support ticket" }, { status: 400 }); }
}
