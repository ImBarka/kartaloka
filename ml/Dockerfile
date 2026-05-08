FROM python:3.12-slim

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 libsm6 libxrender1 libxext6 \
    && rm -rf /var/lib/apt/lists/*

# Python deps (CPU-only onnxruntime untuk cloud)
COPY requirements.txt .
RUN pip install --no-cache-dir \
    ultralytics \
    fastapi \
    "uvicorn[standard]" \
    pillow \
    numpy \
    python-multipart \
    onnxruntime \
    onnx

# Copy model weights dan API code
COPY runs/export/best.onnx /app/model/best.onnx
COPY api/ /app/api/

# Override path model ke lokasi di container
ENV MODEL_PATH=/app/model/best.onnx

EXPOSE 8000
CMD ["uvicorn", "api.server:app", "--host", "0.0.0.0", "--port", "8000"]
