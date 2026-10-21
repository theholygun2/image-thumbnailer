variable "name" {
  description = "Name for the SNS topic and the alarm."
  type        = string
}

variable "queue_name" {
  description = "Name (not URL or ARN) of the dead-letter queue to watch."
  type        = string
}

variable "email" {
  description = "Address that receives alarm notifications. It must confirm the subscription once."
  type        = string
}

variable "period_seconds" {
  description = "Evaluation window for the metric."
  type        = number
  default     = 300
}

variable "threshold" {
  description = "Alarm when the visible message count is greater than this."
  type        = number
  default     = 0
}

variable "tags" {
  type    = map(string)
  default = {}
}