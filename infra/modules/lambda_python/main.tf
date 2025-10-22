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
