FROM public.ecr.aws/lambda/python:3.12

# Copy and install Python deps
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --only-binary=:all: -r requirements.txt --target "${LAMBDA_TASK_ROOT}"

# App code
COPY app.py ${LAMBDA_TASK_ROOT}

# Set the handler
CMD ["app.lambda_handler"]

