FROM python:3.11-slim

# Install system dependencies: ffmpeg and curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy backend code
COPY backend/ /app/backend/

# Create storage and cache directories
ENV UPLOAD_DIR=/data/uploads
ENV OUTPUT_DIR=/data/outputs
ENV HF_HOME=/data/cache/huggingface
RUN mkdir -p /data/uploads /data/outputs /data/cache/huggingface

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
