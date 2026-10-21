variable "region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "ap-southeast-1"
}

variable "environment" {
  description = "Environment name, e.g. dev or prod. Used in tags and resource names."
  type        = string
}

variable "bucket_name" {
  description = "Globally unique name for the images bucket (max 63 characters)."
  type        = string
}

variable "vpc_id" {
  description = "VPC that the instance and its security group live in."
  type        = string
}

variable "subnet_id" {
  description = "A public subnet (route to an internet gateway) in that VPC."
  type        = string
}

variable "alert_email" {
  description = "Email address for DLQ alarm notifications."
  type        = string
}