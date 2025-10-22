variable "ml_model_storage" {
  description = "Bucket to store ML model."
  type        = string
}

variable "ml_model_tags" {
  description = "Tags to apply to ML model S3 resources."
  type        = map(string)
  default     = {}
}

