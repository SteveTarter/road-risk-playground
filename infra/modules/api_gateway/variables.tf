variable "api_name" { 
    type = string
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
  type = list(string) 
  default = ["*"]
}

variable "cors_allowed_headers" {
  type = list(string)
  default = ["content-type", "authorization"] 
}
variable "cors_allowed_methods" {
  type    = list(string)
  default = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
}

variable "enable_access_logs" {
  type = bool 
  default = true 
}

variable "tags" { 
  type = map(string) 
  default = {} 
}

# Custom API gateway domain (REGIONAL cert, same region as API)
variable "enable_custom_domain" { 
  type = bool
  default = false
}

variable "api_domain_name" {
  type = string 
  default = null
}

variable "api_certificate_arn" {
  type = string
  default = null
}

variable "hosted_zone_id" { 
  type = string 
  default = null
}

