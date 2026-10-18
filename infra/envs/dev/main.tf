module "images_bucket" {
  source = "../../modules/s3_bucket"

  bucket_name          = var.bucket_name
  force_destroy        = true
  cors_allowed_origins = ["*"]
}

module "images_queue" {
  source = "../../modules/sqs_queue"

  name              = "thumbnailer-${var.environment}"
  source_bucket_arn = module.images_bucket.bucket_arn
}

# Only objects under uploads/ trigger the pipeline, so writing thumbnails/
# never retriggers the worker.
resource "aws_s3_bucket_notification" "uploads" {
  bucket = module.images_bucket.bucket_name

  queue {
    queue_arn     = module.images_queue.queue_arn
    events        = ["s3:ObjectCreated:*"]
    filter_prefix = "uploads/"
  }
  # The queue policy must exist before S3 validates the destination, or the
  # notification fails with "Unable to validate the following destination".
  depends_on = [module.images_queue]
}

# What the worker may touch: read originals, write thumbnails, nothing else.
data "aws_iam_policy_document" "worker_s3" {
  statement {
    sid       = "ReadUploads"
    actions   = ["s3:GetObject"]
    resources = ["${module.images_bucket.bucket_arn}/uploads/*"]
  }

  statement {
    sid       = "WriteThumbnails"
    actions   = ["s3:PutObject"]
    resources = ["${module.images_bucket.bucket_arn}/thumbnails/*"]
  }
}

module "worker" {
  source = "../../modules/lambda_function"

  name        = "thumbnailer-${var.environment}-worker"
  zip_path    = "${path.root}/../../../apps/worker/dist/worker.zip"
  queue_arn   = module.images_queue.queue_arn
  policy_json = data.aws_iam_policy_document.worker_s3.json
}