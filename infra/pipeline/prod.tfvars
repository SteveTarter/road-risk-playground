aws_region          = "us-east-1"
domain_name         = "tarterware.com"
subdomain           = "road-risk-playground"
hosted_zone_id      = "Z02393963LIKIVO4RKIGY"
acm_certificate_arn = "arn:aws:acm:us-east-1:755935564186:certificate/6d587c4b-4620-470d-bb0c-73a34ac81752"

price_class         = "PriceClass_100"
default_root_object = "index.html"

enable_access_logs  = false
logs_bucket_name    = null

tags = {
  app = "road-risk-playground"
  env = "prod"
}

