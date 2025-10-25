locals { stage_name = "$default" }

resource "aws_apigatewayv2_api" "this" {
  name          = var.api_name
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = var.cors_allowed_origins
    allow_headers = var.cors_allowed_headers
    allow_methods = var.cors_allowed_methods
  }

  tags = var.tags
}

resource "aws_apigatewayv2_integration" "lambda_proxy" {
  api_id                 = aws_apigatewayv2_api.this.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  integration_uri        = var.lambda_invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "root_proxy" {
  api_id    = aws_apigatewayv2_api.this.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_proxy.id}"
}

resource "aws_apigatewayv2_route" "root" {
  api_id    = aws_apigatewayv2_api.this.id
  route_key = "ANY /"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_proxy.id}"
}

resource "aws_cloudwatch_log_group" "api" {
  count             = var.enable_access_logs ? 1 : 0
  name              = "/aws/apigateway/${var.api_name}"
  retention_in_days = 30
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.this.id
  name        = local.stage_name
  auto_deploy = true

  dynamic "access_log_settings" {
    for_each = var.enable_access_logs ? [1] : []
    content {
      destination_arn = aws_cloudwatch_log_group.api[0].arn
      format = jsonencode({
        requestId      = "$context.requestId"
        requestTime    = "$context.requestTime"
        httpMethod     = "$context.httpMethod"
        path           = "$context.path"
        routeKey       = "$context.routeKey"
        status         = "$context.status"
        responseLength = "$context.responseLength"
        integration    = {
          status = "$context.integration.status"
          error  = "$context.integration.error"
        }
      })
    }
  }

  tags = var.tags
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

resource "aws_lambda_permission" "allow_apigw" {
  statement_id  = "AllowInvokeFromAPIGW"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_arn
  principal     = "apigateway.amazonaws.com"

  # Covers any stage/method/resource under this API
  source_arn = "${aws_apigatewayv2_api.this.execution_arn}/*/*"
}

# Custom domain + mapping + DNS
resource "aws_apigatewayv2_domain_name" "custom" {
  count = var.enable_custom_domain ? 1 : 0

  domain_name = var.api_domain_name
  domain_name_configuration {
    certificate_arn = var.api_certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }

  tags = var.tags
}

resource "aws_apigatewayv2_api_mapping" "mapping" {
  count       = var.enable_custom_domain ? 1 : 0
  api_id      = aws_apigatewayv2_api.this.id
  domain_name = aws_apigatewayv2_domain_name.custom[0].domain_name
  stage       = aws_apigatewayv2_stage.default.name
}

resource "aws_route53_record" "api_alias_a" {
  count   = var.enable_custom_domain ? 1 : 0
  zone_id = var.hosted_zone_id
  name    = aws_apigatewayv2_domain_name.custom[0].domain_name
  type    = "A"

  alias {
    name                   = aws_apigatewayv2_domain_name.custom[0].domain_name_configuration[0].target_domain_name
    zone_id                = aws_apigatewayv2_domain_name.custom[0].domain_name_configuration[0].hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "api_alias_aaaa" {
  count   = var.enable_custom_domain ? 1 : 0
  zone_id = var.hosted_zone_id
  name    = aws_apigatewayv2_domain_name.custom[0].domain_name
  type    = "AAAA"

  alias {
    name                   = aws_apigatewayv2_domain_name.custom[0].domain_name_configuration[0].target_domain_name
    zone_id                = aws_apigatewayv2_domain_name.custom[0].domain_name_configuration[0].hosted_zone_id
    evaluate_target_health = false
  }
}

