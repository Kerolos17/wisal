import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wisal-wedding.vercel.app";
  return { rules: [{ userAgent: "*", allow: ["/", "/invite/"], disallow: ["/admin", "/workspace", "/api/"] }], sitemap: `${base}/sitemap.xml` };
}
