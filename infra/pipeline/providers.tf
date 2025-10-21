terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.50"
    }
  }
}

# Primary region for S3 and Route53 API calls
provider "aws" {
  region = var.aws_region
}

# CloudFront/ACM region
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

