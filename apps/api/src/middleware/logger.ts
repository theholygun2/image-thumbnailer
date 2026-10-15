import { createMiddleware } from "hono/factory";
import { logger } from "../lib/pino";

/**
 * Structured request logger — replaces hono/logger's plain-text output with
 * pino JSON lines (method, path, status, duration).
 */
export const loggerMiddleware = createMiddleware(async (c, next) => {
  const start = performance.now();
  await next();
  const durationMs = Math.round(performance.now() - start);

  logger.info(
    {
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs,
    },
    `${c.req.method} ${c.req.path} ${c.res.status} ${durationMs}ms`,
  );
});
