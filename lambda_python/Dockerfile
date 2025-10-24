FROM public.ecr.aws/lambda/python:3.12

# Add OpenMP (and Fortran runtime, often needed by numpy/lightgbm)
RUN dnf -y install libgomp libgfortran && dnf clean all

# Copy and install Python deps
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --only-binary=:all: -r requirements.txt --target "${LAMBDA_TASK_ROOT}"

# App code
COPY app.py ${LAMBDA_TASK_ROOT}

# Create directory for ML model and copy it there
RUN mkdir -p ${LAMBDA_TASK_ROOT}/ml_model/export
COPY /ml_model/export/* ${LAMBDA_TASK_ROOT}/ml_model/export

# Sanity check during build
RUN python -c "import lightgbm, numpy; print('lightgbm ok')"

# Set the handler
CMD ["app.lambda_handler"]

