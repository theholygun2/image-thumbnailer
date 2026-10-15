import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { describeRoute, resolver } from "hono-openapi";
// Adjust this import to wherever your template exports it.
import { validationErrorResponse } from "../lib/openapi";
import { imageIdParamSchema, imageStatusSchema } from "../schemas";
import { getImageStatus } from "../services/images";

export const imagesRoute = new Hono().get(
  "/:id",
  describeRoute({
    tags: ["Images"],
    summary: "Get thumbnail status",
    description:
      "Returns `pending` until the worker has written the thumbnail, then `ready` with a short-lived presigned URL.",
    responses: {
      200: {
        description: "Thumbnail status",
        content: {
          "application/json": { schema: resolver(imageStatusSchema) },
        },
      },
      400: validationErrorResponse,
    },
  }),
  zValidator("param", imageIdParamSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    return c.json(await getImageStatus(id));
  },
);