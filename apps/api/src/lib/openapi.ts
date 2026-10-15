import { resolver } from "hono-openapi";
import { z } from "zod";

/**
 * Top-level OpenAPI document config, shared by the live `/openapi.json`
 * route (in `app.ts`) and any offline export script. Keeping it here means
 * both always produce the same document.
 *
 * No `servers` entry on purpose: without one, Scalar sends requests to
 * whatever origin is serving the docs, so it works locally and on EC2
 * without an extra env var.
 */
export const openApiDocumentation = {
  openapi: "3.1.0",
  info: {
    title: "Image Thumbnailer API",
    version: "1.0.0",
    description:
      "Request a presigned S3 upload URL, upload the image directly to S3, then poll for the generated thumbnail.",
  },
};

/**
 * Shared OpenAPI response builders for `describeRoute()`, so every route
 * documents the project's error shape consistently.
 */

const apiErrorSchema = (message: string, key: "error" | "message" = "error") =>
  z.object({ [key]: z.string().meta({ example: message }) });

/** A generic `{ error: string }` response for a specific status/message. */
export function errorResponse(message: string, key: "error" | "message" = "error") {
  return {
    description: message,
    content: {
      "application/json": { schema: resolver(apiErrorSchema(message, key)) },
    },
  };
}

/**
 * 400 validation error: the shape `@hono/zod-validator` returns on failure
 * (`{ success: false, error: <ZodError>, data: <input> }`). Kept loose since
 * `error` is a serialized Zod issue tree.
 */
export const validationErrorResponse = {
  description: "Validation error",
  content: {
    "application/json": {
      schema: resolver(
        z.object({
          success: z.literal(false),
          error: z.unknown(),
          data: z.unknown(),
        }),
      ),
    },
  },
};