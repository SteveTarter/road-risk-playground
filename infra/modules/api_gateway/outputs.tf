output "api_id"       { value = aws_apigatewayv2_api.this.id }
output "invoke_url"   { value = aws_apigatewayv2_api.this.api_endpoint }
output "stage_name"   { value = aws_apigatewayv2_stage.default.name }
output "custom_domain_name" {
  value = try(aws_apigatewayv2_domain_name.custom[0].domain_name, null)
}

