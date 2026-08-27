import { getPlatformIdentity } from "@/lib/auth/identity";
import { listActivePaymentDestinations } from "@/lib/payment-destinations";
import { getBucket } from "@/lib/wisal-storage";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ method: string }> }) {
  const identity = await getPlatformIdentity();
  if (!identity) return Response.json({ error: "Authentication required" }, { status: 401, headers: { "Cache-Control": "private, no-store" } });

  const { method } = await params;
  const destination = (await listActivePaymentDestinations()).find((item) => item.method === method);
  if (!destination?.qrKey) return Response.json({ error: "QR code not found" }, { status: 404 });

  const object = await getBucket().get(destination.qrKey);
  if (!object) return Response.json({ error: "QR code not found" }, { status: 404 });
  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "image/jpeg",
      "Cache-Control": "private, no-store",
      ...(object.etag ? { ETag: object.etag } : {}),
    },
  });
}
