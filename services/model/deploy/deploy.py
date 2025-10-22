import argparse
import boto3
import botocore.exceptions

# Define the command parser and arguments
parser = argparse.ArgumentParser(description='ML model deployment script')
parser.add_argument('--bucket', action='store', dest='bucket')
parser.add_argument('--model_dir', action='store', dest='model_dir', default='../train/export')

args = parser.parse_args()

s3 = boto3.client("s3")

# Get the version from the file in this directory
with open("version.txt", "r") as f:
  version = f.read()

bucket = args.bucket
model_dir = args.model_dir

# Ensure the model_dir doesn't have trailing slash.
if model_dir[-1] == '/':
    model_dir = model_dir[:-1]

dest_prefix = f"models/road-risk-playground/{version}/"

# Test to see if this version already exists.  It shouldn't.  If so, gripe and exit
try:
  s3.head_object(Bucket=bucket, Key=dest_prefix)
  print(f"{version} already exists!")
  raise
except botocore.exceptions.ClientError as e:
  if e.response['Error']['Code'] == "404":
    # The key does not exist.
    # This is what we want.  Let the execution proceed.
    pass
  elif e.response['Error']['Code'] == 403:
    # Unauthorized, including invalid bucket
    print(f"Unauthorized or invalid bucket: {bucket}")
    raise
  else:
    # Something else has gone wrong.
    raise 

# OK, all should be ready to go
# Create the new folder
s3.put_object(Bucket=bucket, Key=dest_prefix)
s3.upload_file(f"{model_dir}/model.pkl", bucket, f"{dest_prefix}model.pkl")
s3.upload_file(f"{model_dir}/meta.json", bucket, f"{dest_prefix}meta.json")

print(f"Version {version} has been deployed!")

