locals {
  bucket_name = "${var.subdomain}.${var.domain_name}"
}

module "lambda_python" {
  source            = "../modules/lambda_python"
  ml_model_storage  = var.ml_model_storage
  ml_model_tags     = var.ml_model_tags
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
  acm_certificate_arn               = var.acm_certificate_arn
  default_root_object               = var.default_root_object
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

