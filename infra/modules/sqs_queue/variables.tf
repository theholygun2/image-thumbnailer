variable "name" {
  description = "Queue name. The dead-letter queue is named \"<name>-dlq\"."
  type        = string
}

variable "source_bucket_arn" {
  description = "ARN of the S3 bucket allowed to send event messages to this queue."
  type        = string
}

variable "visibility_timeout_seconds" {
  description = "How long a received message stays hidden. Keep it at least 6x the consumer Lambda's timeout."
  type        = number
  default     = 180
}

variable "message_retention_seconds" {
  description = "How long the main queue keeps unprocessed messages (default 4 days)."
  type        = number
  default     = 345600
}

variable "dlq_retention_seconds" {
  description = "How long the DLQ keeps messages (default 14 days). Keep it longer than the main queue's retention."
  type        = number
  default     = 1209600
}

variable "max_receive_count" {
  description = "Failed receives before a message is moved to the DLQ."
  type        = number
  default     = 3
}

variable "tags" {
  description = "Tags applied to both queues."
  type        = map(string)
  default     = {}
}