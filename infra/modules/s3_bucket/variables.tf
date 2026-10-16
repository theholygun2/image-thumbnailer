variable "bucket_name" {
  description = "Globally unique bucket name (max 63 characters)."
  type        = string
}

variable "force_destroy" {
  description = "Allow destroying the bucket while it still contains objects. Use true in dev only."
  type        = bool
  default     = false
}

variable "cors_allowed_origins" {
  description = "Origins allowed to POST to the bucket from a browser. Empty list means no CORS rule."
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Tags applied to the bucket."
  type        = map(string)
  default     = {}
}
