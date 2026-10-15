import { S3Client } from "@aws-sdk/client-s3";
import { env } from "../env";

// No credentials passed on purpose: the SDK's default provider chain uses the
// EC2 instance role in production and your AWS CLI profile locally.
export const s3 = new S3Client({ region: env.AWS_REGION });