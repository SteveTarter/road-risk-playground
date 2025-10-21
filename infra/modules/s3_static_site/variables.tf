variable "bucket_name" {
  description = "Exact bucket name (usually the FQDN)."
  type        = string
}

variable "enable_versioning" {
  description = "Enable S3 object versioning."
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags to apply to S3 resources."
  type        = map(string)
  default     = {}
}

