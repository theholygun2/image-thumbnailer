import app from "./app";
import { env } from "./env";
import { logger } from "./lib/pino";

const server = Bun.serve({
  port: env.PORT,
  hostname: "0.0.0.0",
  fetch: app.fetch,
});

logger.info(`Server running on port ${server.port}`);

/**
 * Graceful shutdown — orchestrators (Docker, ECS, k8s, etc.) send SIGTERM
 * routinely during deploys/scaling, not just on crash. Stop accepting new
 * connections, let in-flight requests finish, then close the DB pool before
 * exiting, so a rolling deploy doesn't drop requests or leak connections.
 */
async function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully`);

  await server.stop();

  logger.info("Shutdown complete");
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
