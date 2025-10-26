variable "aws_region" {
  type        = string
  description = "Home region for S3/Route53 API ops"
}

variable "domain_name" {
  description = "Apex domain, e.g., tarterware.com"
  type        = string
}

variable "subdomain" {
  description = "Host label, e.g., road-risk-playground"
  type        = string
}

variable "hosted_zone_id" {
  description = "Hosted zone ID for domain_name"
  type        = string
}

variable "acm_certificate_arn" {
  description = "ACM cert (must be in aws_region"
  type        = string
}

variable "price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100"
}

variable "default_root_object" {
  description = "Default root object for ststic S3 site"
  type        = string
  default     = "index.html"
}

variable "enable_access_logs" {
  description = "Enable access logs"
  type        = bool
  default     = false
}

variable "logs_bucket_name" {
  description = "Bucket name to contain logs"
  type        = string
  default     = null
}

variable "tags" {
  description = "Tags to apply to all resources."
  type        = map(string)
  default     = {}
}

variable "image_url" {
  description = "URL of ECR image for lambda function"
  type        = string
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

