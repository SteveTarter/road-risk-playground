resource "aws_s3_bucket" "ml_model_storage" {
  bucket = var.ml_model_storage
  tags   = var.ml_model_tags
}

resource "aws_s3_object" "models_folder" {
    bucket = "${aws_s3_bucket.ml_model_storage.id}"
    acl    = "private"
    key    = "models/"
    source = "/dev/null"
}

resource "aws_s3_object" "app_folder" {
    bucket = "${aws_s3_bucket.ml_model_storage.id}"
    acl    = "private"
    key    = "models/road-risk-playground/"
    source = "/dev/null"
}

data "aws_caller_identity" "this" {}
data "aws_region" "this" {}

# Create the log group up front so we can scope permissions tightly
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/road-risk-playground"
  retention_in_days = var.log_retention_days
}

# Trust policy: allow Lambda to assume this role
data "aws_iam_policy_document" "assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

# Execution policy:
# - CloudWatch Logs: create stream + put events (CreateLogGroup is "*" scoped by AWS)
# - S3: list the model prefix and get objects under it
data "aws_iam_policy_document" "exec" {
  statement {
    sid     = "CloudWatchLogsCreateGroup"
    effect  = "Allow"
    actions = ["logs:CreateLogGroup"]
    resources = ["*"]
  }

  statement {
    sid     = "CloudWatchLogsWrite"
    effect  = "Allow"
    actions = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.lambda.arn}:*"]
  }

  statement {
    sid     = "S3ModelRead"
    effect  = "Allow"
    actions = ["s3:ListBucket"]
    resources = ["arn:aws:s3:::${var.ml_model_storage}"]
    condition {
      test     = "StringLike"
      variable = "s3:prefix"
      values   = ["*"]
    }
  }

  statement {
    sid     = "S3ModelGet"
    effect  = "Allow"
    actions = ["s3:GetObject"]
    resources = ["arn:aws:s3:::${var.ml_model_storage}/*"]
  }
}
resource "aws_iam_role" "lambda_exec" {
  name               = "road-risk-playground-exec"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

resource "aws_iam_policy" "lambda_exec" {
  name   = "road-risk-playground-exec"
  policy = data.aws_iam_policy_document.exec.json
}

resource "aws_iam_role_policy_attachment" "attach_exec" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = aws_iam_policy.lambda_exec.arn
}

# Lambda function from container image
resource "aws_lambda_function" "this" {
  function_name    = "road-risk-playground"
  package_type     = "Image"
  image_uri        = "755935564186.dkr.ecr.us-east-1.amazonaws.com/road-risk-playground:latest"

  role             = aws_iam_role.lambda_exec.arn

  timeout          = 30
  memory_size      = 512
  publish          = true

  environment {
    variables = {
      MAPBOX_TOKEN = var.mapbox_token
      MODEL_S3_BUCKET = var.ml_model_storage
      MODEL_S3_PREFIX = var.ml_model_prefix
    }
  }
}
