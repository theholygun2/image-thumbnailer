import {
  GetObjectCommand,
  HeadObjectCommand,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../env";
import { s3 } from "../lib/s3";
import type { AllowedContentType } from "../schemas";

const EXTENSIONS: Record<AllowedContentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function createUpload(contentType: AllowedContentType) {
  const id = crypto.randomUUID();
  const key = `uploads/${id}.${EXTENSIONS[contentType]}`;

  // Presigned POST (not PUT) so S3 itself enforces the size limit and content type.
  const { url, fields } = await createPresignedPost(s3, {
    Bucket: env.S3_BUCKET,
    Key: key,
    Fields: { "Content-Type": contentType },
    Conditions: [
      ["content-length-range", 1, env.MAX_UPLOAD_BYTES],
      ["eq", "$Content-Type", contentType],
    ],
    Expires: env.UPLOAD_URL_TTL_SECONDS,
  });

  return { id, url, fields, expiresIn: env.UPLOAD_URL_TTL_SECONDS };
}

export async function getImageStatus(id: string) {
  const key = `thumbnails/${id}.jpg`;

  try {
    await s3.send(new HeadObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
  } catch (err) {
    if (
      err instanceof S3ServiceException &&
      (err.name === "NotFound" || err.$metadata.httpStatusCode === 404)
    ) {
      return { status: "pending" as const };
    }
    throw err;
  }

  const thumbnailUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }),
    { expiresIn: env.DOWNLOAD_URL_TTL_SECONDS },
  );

  return {
    status: "ready" as const,
    thumbnailUrl,
    expiresIn: env.DOWNLOAD_URL_TTL_SECONDS,
  };
}