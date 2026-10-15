module "example_bucket" {
  source = "../../modules/s3_bucket"
  bucket_name = "kdflasjflasdjlfjasklfjsaljfl"
}

output "bucket_arn" {
  value = module.example_bucket.bucket_arn
}