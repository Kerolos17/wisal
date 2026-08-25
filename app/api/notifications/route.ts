import { getCurrentOwnerEmail } from "@/lib/current-owner";
import { listNotifications, markNotificationsRead } from "@/lib/support-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try { return Response.json({ notifications: await listNotifications(await getCurrentOwnerEmail()) }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to load notifications" }, { status: 500 }); }
}

export async function PATCH() {
  try { return Response.json({ notifications: await markNotificationsRead(await getCurrentOwnerEmail()) }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to update notifications" }, { status: 500 }); }
}
