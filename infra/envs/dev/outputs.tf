output "bucket_name" {
  value = module.images_bucket.bucket_name
}

output "queue_url" {
  value = module.images_queue.queue_url
}

output "dlq_url" {
  value = module.images_queue.dlq_url
}

output "worker_function_name" {
  value = module.worker.function_name
}

output "worker_log_group" {
  value = module.worker.log_group_name
}

output "api_instance_id" {
  value = module.api_host.instance_id
}

output "api_public_ip" {
  value = module.api_host.public_ip
}