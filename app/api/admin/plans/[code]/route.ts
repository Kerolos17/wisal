import { updatePlatformPlan } from "@/lib/admin-data";
import { forbiddenUnless } from "@/lib/admin-auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const forbidden = await forbiddenUnless("plans.manage"); if (forbidden) return forbidden;
    const { code } = await params;
    const body = await request.json() as { priceEgp?: unknown; active?: unknown; featured?: unknown };
    const changes: { priceEgp?: number; active?: boolean; featured?: boolean } = {};
    if (body.priceEgp !== undefined) {
      if (!Number.isInteger(body.priceEgp) || Number(body.priceEgp) < 0) return Response.json({ error: "priceEgp must be a positive integer" }, { status: 400 });
      changes.priceEgp = Number(body.priceEgp);
    }
    if (typeof body.active === "boolean") changes.active = body.active;
    if (typeof body.featured === "boolean") changes.featured = body.featured;
    if (!Object.keys(changes).length) return Response.json({ error: "No valid changes" }, { status: 400 });
    const plan = await updatePlatformPlan(code, changes);
    return plan ? Response.json({ plan }) : Response.json({ error: "Plan not found" }, { status: 404 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to update plan" }, { status: 500 }); }
}
