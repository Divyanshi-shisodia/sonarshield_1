# =========================
# Stage 1: Build React frontend
# =========================
FROM node:20-slim AS frontend-build

WORKDIR /frontend

COPY frontend/package.json frontend/package-lock.json* ./

RUN npm ci

COPY frontend .

RUN npm run build


# =========================
# Stage 2: FastAPI backend
# =========================
FROM python:3.11-slim

WORKDIR /app

# Required system libraries for OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt backend/requirements.txt

RUN pip install --no-cache-dir --default-timeout=1000 --retries=5 -r backend/requirements.txt

# Copy backend and project data
COPY backend backend
COPY data data
COPY reports reports

# Copy React production build into Python container
COPY --from=frontend-build /frontend/dist frontend/dist

# Generate demo data if required
RUN python backend/ml/demo_data_gen.py

# Render provides the PORT environment variable
EXPOSE 10000

# Start FastAPI and use Render's PORT
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-10000}"]