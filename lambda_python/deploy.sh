#!/usr/bin/env bash

# Ensure authorization token is active
aws ecr get-login-password | docker login --username AWS --password-stdin   $(aws sts get-caller-identity --query 'Account' --output text).dkr.ecr.$(aws configure get region).amazonaws.com

# Get account and region details
export ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)
export REGION=$(aws configure get region)

# Build, tag, and push the image
docker build -t road-risk-playground .
aws ecr batch-delete-image   --region "$REGION"   --repository-name road-risk-playground   --image-ids imageTag=latest
docker tag road-risk-playground:latest   "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/road-risk-playground:latest"
docker push "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/road-risk-playground:latest"

