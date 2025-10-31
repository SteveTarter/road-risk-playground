PIPE := infra/pipeline

build:
	cd web && NODE_ENV=production && npm ci && npm run build

deploy: build
	BUCKET=$$(cd $(PIPE) && terraform output -raw site_bucket_name); \
	aws s3 sync web/build/ s3://$$BUCKET/ --delete \
	  --cache-control "public,max-age=31536000,immutable"; \
	DIST_ID=$$(cd $(PIPE) && terraform output -raw distribution_id); \
	aws cloudfront create-invalidation --distribution-id $$DIST_ID --paths "/*"
