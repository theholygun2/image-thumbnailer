import { z } from "zod";

export const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedContentType = (typeof ALLOWED_CONTENT_TYPES)[number];

export const createUploadSchema = z.object({
  contentType: z.enum(ALLOWED_CONTENT_TYPES),
});

export const uploadResponseSchema = z.object({
  id: z.uuid(),
  url: z.url(),
  fields: z.record(z.string(), z.string()),
  expiresIn: z.number().int(),
});

export const imageIdParamSchema = z.object({
  id: z.uuid(),
});

export const imageStatusSchema = z.object({
  status: z.enum(["pending", "ready"]),
  thumbnailUrl: z.url().optional(),
  expiresIn: z.number().int().optional(),
});