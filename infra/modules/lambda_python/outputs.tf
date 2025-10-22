output "bucket_id" {
  value = aws_s3_bucket.ml_model_storage.id
}

output "bucket_arn" {
  value = aws_s3_bucket.ml_model_storage.arn
}

output "bucket_name" {
  value = aws_s3_bucket.ml_model_storage.bucket
}

