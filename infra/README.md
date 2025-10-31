# Infrastructure

This directory contains the Terraform configuration used to deploy the Road Risk Playground application on AWS.
It provisions the static website, backend API, and supporting resources in a reproducible way.

## Prerequisites
You’ll need an AWS account with the following already configured:
* **Route 53 hosted zone** for your domain (e.g. tarterware.com)
* **ACM certificate** in the same region that covers both the root domain and one wildcard subdomain (e.g. tarterware.com and *.tarterware.com)

You must also push the backend Lambda container image to Amazon ECR before running Terraform.
Terraform references that image by URL—if it doesn’t exist, deployment will fail.

## Build and Push the Lambda Image
From the root of the repository:
```bash
cd lambda_python
bash deploy.sh
```

## Create a Terraform Variables file
Create a file such as prod.tfvars that points Terraform to the correct AWS resources:

```hd
aws_region          = "<YOUR_REGION>"
domain_name         = "<YOUR_DOMAIN>"
subdomain           = "road-risk-playground"
hosted_zone_id      = "<ROUTE_53_ZONE_ID_FOR_YOUR_DOMAIN>"
acm_certificate_arn = "arn:aws:acm:<YOUR_REGION>:<AWS_ACCOUNT_ID>:certificate/<CERTIFICATE_UUID>"

price_class         = "PriceClass_100"
default_root_object = "index.html"

enable_access_logs  = false
logs_bucket_name    = null

tags = {
  app = "road-risk-playground"
  env = "prod"
}

image_url          = "<AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/road-risk-playground:latest"

mapbox_token       = "<MAPBOX_TOKEN>"
```

## Deployment
From the infra/pipeline directory:

```bash
cd infra/pipeline
terraform init -upgrade
terraform plan -var-file=prod.tfvars
terraform apply -var-file=prod.tfvars
```
Terraform will:
* Create or update the S3 bucket for the static React build
* Configure a CloudFront distribution with HTTPS and your chosen domain
* Deploy the Lambda container and API Gateway endpoint
* Wire all components together via IAM roles and environment variables
Once complete, the output will display the CloudFront URL and S3 bucket name.

## Updating the Front End
After Terraform completes, from the root of the repository:
```bash
make deploy
```

## Teardown
To remove all deployed resources:

```bash
terraform destroy -var-file=prod.tfvars
```
