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
  description = "ACM cert in us-east-1 for CloudFront"
  type        = string
}

variable "default_root_object" {
  type        = string
  default     = "index.html"
}

variable "price_class" {
  type        = string
  default     = "PriceClass_100"
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

# S3 origin inputs (from s3_static_site)
variable "s3_bucket_id" {
  type        = string
  description = "ID of the site bucket"
}
variable "s3_bucket_arn" {
  type        = string
  description = "ARN of the site bucket"
}
variable "s3_bucket_name" {
  type        = string
  description = "Name of the site bucket"
}
variable "s3_bucket_regional_domain_name" {
  type        = string
  description = "Regional domain name of the site bucket"
}

