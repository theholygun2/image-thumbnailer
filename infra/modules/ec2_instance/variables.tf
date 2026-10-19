variable "name" {
  description = "Name used for the instance, role, profile, and security group."
  type        = string
}

variable "policy_json" {
  description = "IAM policy document (JSON) with the instance's permissions, e.g. S3 access."
  type        = string
}

variable "user_data" {
  description = "Script that runs on first boot."
  type        = string
  default     = ""
}

variable "vpc_id" {
  description = "VPC that the instance and its security group live in."
  type        = string
}

variable "subnet_id" {
  description = "A public subnet (route to an internet gateway) in that VPC."
  type        = string
}

variable "instance_type" {
  description = "Must match the architecture (t3.* for x86_64, t4g.* for arm64)."
  type        = string
  default     = "t3.micro"
}

variable "architecture" {
  type    = string
  default = "x86_64"

  validation {
    condition     = contains(["x86_64", "arm64"], var.architecture)
    error_message = "architecture must be x86_64 or arm64."
  }
}

variable "volume_size_gb" {
  description = "Root volume size. Docker images take space, so keep at least 16."
  type        = number
  default     = 16
}

variable "http_ingress_cidrs" {
  description = "CIDR blocks allowed to reach port 80. Use your own IP/32 to restrict access."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "tags" {
  type    = map(string)
  default = {}
}