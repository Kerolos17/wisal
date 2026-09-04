import { logger } from "./lib/logger";
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }

  logger.info("nextjs_server_started", { runtime: process.env.NEXT_RUNTIME || "unknown" });
}

export const onRequestError = Sentry.captureRequestError;
