import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { describeRoute, resolver } from "hono-openapi";
// Adjust these imports to wherever your template exports them.
import { validationErrorResponse } from "../lib/openapi";
import { createUploadSchema, uploadResponseSchema } from "../schemas";
import { createUpload } from "../services/images";

export const uploadsRoute = new Hono().post(
  "/",
  describeRoute({   
    tags: ["Uploads"],
    summary: "Request an upload URL",
    description:
      "Returns a presigned S3 POST (url + fields). The client uploads the image directly to S3; the thumbnail is generated asynchronously.",
    requestBody: {
      required: true,
      content: { "application/json": { schema: resolver(createUploadSchema) } },
    },
    responses: {
      201: {
        description: "Presigned POST for a direct S3 upload",
        content: {
          "application/json": { schema: resolver(uploadResponseSchema) },
        },
      },
      400: validationErrorResponse,
    },
  }),
  zValidator("json", createUploadSchema),
  async (c) => {
    const input = c.req.valid("json");
    return c.json(await createUpload(input.contentType), 201);
  },
);