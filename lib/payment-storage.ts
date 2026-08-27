import { createHash } from "node:crypto";
import { getBucket } from "@/lib/wisal-storage";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024; // 5 MB

function receiptKeyFor(userId: string, id: string, ext: string) {
  return `receipts/${userId}/${id}.${ext}`;
}

function extFromMime(mime: string): string | null {
  switch (mime) {
    case "image/jpeg": return "jpg";
    case "image/png": return "png";
    case "image/webp": return "webp";
    case "application/pdf": return "pdf";
    default: return null;
  }
}

export async function storeReceipt(userId: string, id: string, buffer: Buffer, mime: string): Promise<{ key: string; size: number; checksum: string }> {
  const ext = extFromMime(mime);
  if (!ext) throw new Error("Invalid receipt file type");
  if (!ALLOWED_MIME.has(mime)) throw new Error("Invalid receipt file type");
  if (buffer.byteLength > MAX_RECEIPT_BYTES) throw new Error("Receipt file is too large");

  // Content inspection: verify magic bytes match the declared MIME
  if (!verifyMagicBytes(buffer, mime)) throw new Error("Receipt content does not match its type");

  const checksum = createHash("sha256").update(buffer).digest("hex");
  const key = receiptKeyFor(userId, id, ext);
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  await getBucket().put(key, arrayBuffer, { httpMetadata: { contentType: mime } });
  return { key, size: buffer.byteLength, checksum };
}

export async function readReceipt(key: string): Promise<{ body: Blob; contentType: string } | null> {
  if (!key.startsWith("receipts/")) throw new Error("Invalid receipt key");
  const object = await getBucket().get(key);
  if (!object) return null;
  return { body: object.body, contentType: object.httpMetadata?.contentType ?? "application/octet-stream" };
}

function verifyMagicBytes(buffer: Buffer, mime: string): boolean {
  if (buffer.byteLength < 4) return false;
  const head = buffer.subarray(0, 8);
  switch (mime) {
    case "image/jpeg":
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case "image/png":
      return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    case "image/webp":
      return head.toString("ascii", 0, 4) === "RIFF" && head.toString("ascii", 4, 8) === "WEBP";
    case "application/pdf":
      return head.toString("ascii", 0, 5) === "%PDF-";
    default:
      return false;
  }
}
