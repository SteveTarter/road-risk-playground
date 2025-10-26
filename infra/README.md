# Infrastructure

This section of the repo contains the Terraform configuration files to deploy the various components of this application on AWS.

## Prerequisites

Since this will be deploying to Amazon Web Services, you must have an AWS account.  Within this account, you also need:

* a hosted zoned in Route 53 that points to your website (e.g. tarterware.com)
* a certificate in AWS Certificate Manager that corresponds to the site above, with one wildcard subdomain defined (e.g. tarterware.com, *.tarterware.com)

Before running terraform, you also need to run the deployment script for the lambda endpoint image to the Elastic Container Registry.  If the image isn't present, terraform will not be able to complete installation.

## Create Variables file

You need to create a terraform variables file to point to the resources within your account.  Below is an example:

```bash
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

ml_model_storage   = "ml-road-risk-playground"
ml_model_prefix    = "models/road-risk-playground/0.1.0/"
image_url          = "<AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/road-risk-playground:latest"

mapbox_token       = "<MAPBOX_TOKEN>"
```

## Installation

Run the following commands:

```bash
cd pipeline
terraform init -upgrade
terraform plan -var-file=prod.tfvars
terraform apply -var-file=prod.tfvars
```

## Uninstall

Run the following command:

```bash
terraform destroy -var-file=prod.tfvars
```
