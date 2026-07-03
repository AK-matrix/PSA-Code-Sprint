# ── Backend — PSA LangGraph API ──────────────────────────────────────────────
FROM python:3.11-slim AS base

WORKDIR /app

# System deps for chromadb / sentence-transformers (hnswlib requires build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (layer cached until requirements change)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# Pre-download the sentence-transformer model so the container starts instantly
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

EXPOSE 5000

ENV FLASK_ENV=production \
    LOG_LEVEL=INFO \
    PORT=5000

CMD ["python", "-m", "flask", "--app", "backend.app", "run", "--host", "0.0.0.0", "--port", "5000"]
