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

ml_model_storage   = "ml-road-risk-playground"
ml_model_prefix    = "models/road-risk-playground/0.1.0/"
image_url          = "755935564186.dkr.ecr.us-east-1.amazonaws.com/road-risk-playground:latest"

mapbox_token       = "pk.eyJ1IjoidGFydGVyd2FyZXN0ZXZlIiwiYSI6ImNseGoyY2p3ZDFwMWYyaXB3bjRlenJqeXMifQ.aWxwf9Ju_O29ctHsszGeAw"

ml_model_tags = {
  app = "road-risk-playground"
  env = "prod"
}
