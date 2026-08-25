import { neon } from "@neondatabase/serverless";

type WisalBucket = {
  put(key: string, value: ArrayBuffer, options?: { httpMetadata?: { contentType?: string } }): Promise<void>;
  get(key: string): Promise<{ body: Blob; httpMetadata?: { contentType?: string }; etag?: string } | null>;
  delete(key: string): Promise<void>;
};

function getStorageSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is unavailable.");
  return neon(connectionString);
}

async function digestHex(value: ArrayBuffer) {
  const digest = await crypto.subtle.digest("SHA-256", value);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

const bucket: WisalBucket = {
  async put(key, value, options) {
    const sql = getStorageSql();
    const base64 = Buffer.from(value).toString("base64");
    const etag = await digestHex(value);
    const contentType = options?.httpMetadata?.contentType ?? "application/octet-stream";
    await sql.query(
      `INSERT INTO public.media_blobs (key, data, content_type, etag)
       VALUES ($1, decode($2, 'base64'), $3, $4)
       ON CONFLICT (key) DO UPDATE SET
         data = EXCLUDED.data,
         content_type = EXCLUDED.content_type,
         etag = EXCLUDED.etag,
         updated_at = now()`,
      [key, base64, contentType, etag],
    );
  },
  async get(key) {
    const sql = getStorageSql();
    const rows = await sql.query(
      "SELECT encode(data, 'base64') AS data, content_type, etag FROM public.media_blobs WHERE key = $1 LIMIT 1",
      [key],
    ) as Array<{ data: string; content_type: string; etag: string }>;
    const object = rows[0];
    if (!object) return null;
    const bytes = Uint8Array.from(Buffer.from(object.data, "base64"));
    return {
      body: new Blob([bytes], { type: object.content_type }),
      httpMetadata: { contentType: object.content_type },
      etag: object.etag,
    };
  },
  async delete(key) {
    await getStorageSql().query("DELETE FROM public.media_blobs WHERE key = $1", [key]);
  },
};

export function getBucket() {
  return bucket;
}
