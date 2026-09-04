import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const scriptSources = ["'self'", "'unsafe-inline'", ...(process.env.NODE_ENV === "development" ? ["'unsafe-eval'"] : [])];
const sentryIngestOrigin = (() => {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (!dsn) return undefined;

  try {
    return new URL(dsn).origin;
  } catch {
    return undefined;
  }
})();
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src ${scriptSources.join(" ")}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${sentryIngestOrigin ? ` ${sentryIngestOrigin}` : ""}`,
  "media-src 'self' blob:",
  "frame-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
        ],
      },
      {
        source: "/invite/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noimageindex" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Runtime event delivery does not require a build token. Keep source-map
  // upload disabled until an owner deliberately configures one in Vercel.
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  telemetry: false,
  silent: true,
  treeshake: { removeDebugLogging: true, removeTracing: true },
});
