import { getBucket } from "@/lib/wisal-storage";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const joined = key.join("/");

  // This is a public route: only application-generated cover keys may be read.
  const isPublicCover = /^covers\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(joined);
  if (!isPublicCover) {
    return new Response("Not found", { status: 404 });
  }

  const object = await getBucket().get(joined);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, {
    headers: {
      "content-type": object.httpMetadata?.contentType || "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
      ...(object.etag ? { etag: object.etag } : {}),
    },
  });
}
