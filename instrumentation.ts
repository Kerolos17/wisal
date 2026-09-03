import { logger } from "./lib/logger";

export async function register() {
  logger.info("nextjs_server_started", { runtime: process.env.NEXT_RUNTIME || "unknown" });
}
