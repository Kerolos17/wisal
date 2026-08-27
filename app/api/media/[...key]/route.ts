import { getBucket } from "@/lib/wisal-storage";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const joined = key.join("/");

  // SEC-R04: receipts must never be served from the public media route
  if (joined === "receipts" || joined.startsWith("receipts/")) {
    return new Response("Forbidden", { status: 403 });
  }

  const object = await getBucket().get(joined);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, {
    headers: {
      "content-type": object.httpMetadata?.contentType || "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable",
      ...(object.etag ? { etag: object.etag } : {}),
    },
  });
}
