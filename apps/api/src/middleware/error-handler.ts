import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { logger } from "../lib/pino";

/**
 * Centralized error handler for `app.onError`. Normalizes every unhandled
 * error to the project's `{ error: string }` shape (see
 * api-rest-conventions.md) instead of letting Hono's default 500 leak an
 * unstyled response for anything that isn't already an explicit
 * `c.json({ error }, status)` return from a route.
 */
export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }

  logger.error({ err }, "Unhandled error");
  return c.json({ error: "Internal Server Error" }, 500);
};
