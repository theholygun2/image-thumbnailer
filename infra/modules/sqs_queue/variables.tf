variable "sqs_name" {
    type = string
}

variable "tags" {
    type = map(string)
    default = {}
}