output "bucket_name" {
  description = "Bucket name. Used by the S3 notification and the API's S3_BUCKET env var."
  value       = aws_s3_bucket.this.bucket
}

output "bucket_arn" {
  description = "Bucket ARN. Used in queue and IAM policies."
  value       = aws_s3_bucket.this.arn
}
