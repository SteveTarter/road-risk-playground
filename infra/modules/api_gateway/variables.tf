variable "api_name" { 
  description = "API name"
  type        = string
}

variable "lambda_function_arn" {
  description = "Lambda function ARN (use alias-qualified ARN if you have an alias)"
  type        = string
}

variable "lambda_invoke_arn" {
  description = "Lambda invoke ARN matching the function above"
  type        = string
}

variable "cors_allowed_origins" {
  description = "CORS allowed origins" 
  type        = list(string) 
  default     = ["*"]
}

variable "cors_allowed_headers" {
  description = "CORS allowed headers"
  type        = list(string)
  default     = ["content-type", "authorization"] 
}
variable "cors_allowed_methods" {
  description = "CORS allowed methods"
  type        = list(string)
  default     = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
}

variable "enable_access_logs" {
  description = "Enable access logs"
  type        = bool 
  default     = true 
}

variable "tags" { 
  description = "Tags"
  type        = map(string) 
  default     = {} 
}

# Custom API gateway domain (REGIONAL cert, same region as API)
variable "enable_custom_domain" { 
  description = "Enable custom domain"
  type        = bool
  default     = false
}

variable "api_domain_name" {
  description = "API domain name"
  type        = string 
  default     = null
}

variable "api_certificate_arn" {
  description = "Certificate ARN to use for API"
  type        = string
  default     = null
}

variable "hosted_zone_id" { 
  description = "Route 53 hosted Zone ID"
  type        = string 
  default     = null
}
