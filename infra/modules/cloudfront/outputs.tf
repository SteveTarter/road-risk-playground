output "distribution_id" {
  value = aws_cloudfront_distribution.this.id
}

output "distribution_domain_name" {
  value = aws_cloudfront_distribution.this.domain_name
}

output "fqdn" {
  value = "${var.subdomain}.${var.domain_name}"
}

