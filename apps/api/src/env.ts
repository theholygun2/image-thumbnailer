import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "staging", "production", "test"]).default("development"),
    APP_URL: z.url(),
    PORT: z.coerce.number().default(3000),
    AWS_REGION: z.string().min(1),
    S3_BUCKET: z.string().min(1),
    UPLOAD_URL_TTL_SECONDS: z.coerce.number().int().positive().default(300),
    DOWNLOAD_URL_TTL_SECONDS: z.coerce.number().int().positive().default(900),
    MAX_UPLOAD_BYTES: z.coerce
        .number()
        .int()
        .positive()
        .default(10 * 1024 * 1024),
});

// Merge into your template's existing env module if it already has one.
export const env = envSchema.parse(process.env);