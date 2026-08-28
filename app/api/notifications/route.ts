import { getCurrentOwnerEmail } from "@/lib/current-owner";
import { listNotifications, markNotificationsRead } from "@/lib/support-data";
import { apiErrorResponse } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export async function GET() {
  try { return Response.json({ notifications: await listNotifications(await getCurrentOwnerEmail()) }); }
  catch (error) { return apiErrorResponse(error, { message: "Unable to load notifications" }); }
}

export async function PATCH() {
  try { return Response.json({ notifications: await markNotificationsRead(await getCurrentOwnerEmail()) }); }
  catch (error) { return apiErrorResponse(error, { message: "Unable to update notifications" }); }
}
