locals {
  fqdn      = "${var.subdomain}.${var.domain_name}"
  origin_id = "s3-${var.s3_bucket_name}"
}

# OAC for S3 origin
resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "oac-${local.fqdn}"
  description                       = "OAC for ${local.fqdn}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "this" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = local.fqdn
  aliases             = [local.fqdn]
  default_root_object = var.default_root_object
  price_class         = var.price_class

  origin {
    domain_name              = var.s3_bucket_regional_domain_name
    origin_id                = local.origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  default_cache_behavior {
    target_origin_id       = local.origin_id
    viewer_protocol_policy = "redirect-to-https"

    allowed_methods = ["GET", "HEAD"]
    cached_methods  = ["GET", "HEAD"]

    # AWS managed CachingOptimized
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"
    compress        = true
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate {
    acm_certificate_arn      = var.acm_certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  dynamic "logging_config" {
    for_each = var.enable_access_logs && var.logs_bucket_name != null ? [1] : []
    content {
      bucket          = "${var.logs_bucket_name}.s3.amazonaws.com"
      include_cookies = false
      prefix          = "cloudfront/${local.fqdn}/"
    }
  }

  tags = var.tags
}

# Bucket policy that grants CloudFront distribution read access (OAC + SourceArn bind)
data "aws_iam_policy_document" "bucket_policy" {
  statement {
    sid     = "AllowCloudFrontReadViaOAC"
    effect  = "Allow"
    actions = ["s3:GetObject"]
    resources = [
      "${var.s3_bucket_arn}/*"
    ]
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.this.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "site" {
  bucket = var.s3_bucket_id
  policy = data.aws_iam_policy_document.bucket_policy.json
}

# Route 53 alias (A + AAAA) to the distribution
resource "aws_route53_record" "a" {
  zone_id = var.hosted_zone_id
  name    = local.fqdn
  type    = "A"
  alias {
    name                   = aws_cloudfront_distribution.this.domain_name
    zone_id                = aws_cloudfront_distribution.this.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "aaaa" {
  zone_id = var.hosted_zone_id
  name    = local.fqdn
  type    = "AAAA"
  alias {
    name                   = aws_cloudfront_distribution.this.domain_name
    zone_id                = aws_cloudfront_distribution.this.hosted_zone_id
    evaluate_target_health = false
  }
}

