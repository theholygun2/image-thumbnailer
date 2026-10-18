variable "name" {
  description = "Function name. Also used for the IAM role and the log group."
  type        = string
}

variable "zip_path" {
  description = "Path to the deployment zip. Must exist at plan time, so build it first."
  type        = string
}

variable "queue_arn" {
  description = "ARN of the SQS queue that triggers the function."
  type        = string
}

variable "policy_json" {
  description = "IAM policy document (JSON) giving the function access to the resources it works on, e.g. S3."
  type        = string
}

variable "handler" {
  description = "Entry point, as <file>.<function>."
  type        = string
  default     = "handler.lambda_handler"
}

variable "runtime" {
  type    = string
  default = "python3.12"
}

variable "architecture" {
  description = "Must match the platform the zip was built for (build uses manylinux2014_x86_64)."
  type        = string
  default     = "x86_64"

  validation {
    condition     = contains(["x86_64", "arm64"], var.architecture)
    error_message = "architecture must be x86_64 or arm64."
  }
}

variable "timeout_seconds" {
  description = "Function timeout. The queue's visibility timeout must be at least 6x this."
  type        = number
  default     = 30
}

variable "memory_mb" {
  type    = number
  default = 512
}

variable "environment_variables" {
  type    = map(string)
  default = {}
}

variable "batch_size" {
  type    = number
  default = 1
}

variable "max_concurrency" {
  description = "Cap on parallel invocations from the queue (AWS allows 2 to 1000)."
  type        = number
  default     = 5

  validation {
    condition     = var.max_concurrency >= 2 && var.max_concurrency <= 1000
    error_message = "max_concurrency must be between 2 and 1000."
  }
}

variable "log_retention_days" {
  type    = number
  default = 7
}

variable "tags" {
  type    = map(string)
  default = {}
}