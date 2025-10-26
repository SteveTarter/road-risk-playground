locals {
  bucket_name = "${var.subdomain}.${var.domain_name}"
}

module "lambda_python" {
  source             = "../modules/lambda_python"
  ml_model_tags      = var.tags
  image_url          = var.image_url
  mapbox_token       = var.mapbox_token
  log_retention_days = var.log_retention_days
}

module "s3_static_site" {
  source            = "../modules/s3_static_site"
  bucket_name       = local.bucket_name
  enable_versioning = false
  tags              = var.tags
}

module "cloudfront" {
  source                             = "../modules/cloudfront"
  domain_name                        = var.domain_name
  subdomain                          = var.subdomain
  hosted_zone_id                     = var.hosted_zone_id
  acm_certificate_arn                = var.acm_certificate_arn
  default_root_object                = var.default_root_object
  price_class                        = var.price_class
  enable_access_logs                 = var.enable_access_logs
  logs_bucket_name                   = var.logs_bucket_name
  tags                               = var.tags

  # from s3 module
  s3_bucket_id                       = module.s3_static_site.bucket_id
  s3_bucket_arn                      = module.s3_static_site.bucket_arn
  s3_bucket_name                     = module.s3_static_site.bucket_name
  s3_bucket_regional_domain_name     = module.s3_static_site.bucket_regional_domain_name
}

module "api_gateway" {
  source              = "../modules/api_gateway"
  api_name            = "road-risk-api-dev"

  # Prefer alias-qualified ARNs if you use an alias (e.g., "live")
  lambda_function_arn = module.lambda_python.function_arn
  lambda_invoke_arn   = module.lambda_python.invoke_arn

  cors_allowed_origins = [
    "https://${var.subdomain}.${var.domain_name}",
    "http://localhost:9400"
  ]
  cors_allowed_headers = ["content-type", "authorization"]
  cors_allowed_methods = ["GET","POST","PUT","PATCH","DELETE","OPTIONS"]
  enable_access_logs   = true
  tags                 = var.tags

  # Custom API domain
  enable_custom_domain = false
  api_domain_name      = "road-risk-api.${var.domain_name}"
  api_certificate_arn  = var.acm_certificate_arn
  hosted_zone_id       = var.hosted_zone_id
}

output "site_bucket_name" {
  value = module.s3_static_site.bucket_name
}

output "cdn_domain" {
  value = module.cloudfront.distribution_domain_name
}

output "distribution_id" {
  value = module.cloudfront.distribution_id
}

output "fqdn" {
  value = module.cloudfront.fqdn
}

output "api_endpoint" {
  value = module.api_gateway.invoke_url
}
