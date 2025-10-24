variable "aws_region" {
  type        = string
  description = "Home region for S3/Route53 API ops"
}

variable "domain_name" {
  type = string
}

variable "subdomain" {
  type = string
}

variable "hosted_zone_id" {
  type = string
}

variable "acm_certificate_arn" {
  type        = string
  description = "Must be in us-east-1"
}

variable "price_class" {
  type    = string
  default = "PriceClass_100"
}

variable "default_root_object" {
  type    = string
  default = "index.html"
}

variable "enable_access_logs" {
  type    = bool
  default = false
}

variable "logs_bucket_name" {
  type    = string
  default = null
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "image_url" {
  description = "URL of ECR image for lambda function"
  type        = string
}

variable "ml_model_tags" {
  description = "Tags to apply to ML model S3 resources."
  type        = map(string)
  default     = {}
}

variable "mapbox_token" {
  description = "Access token for Mapbox API"
  type        = string
}

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 30
}

