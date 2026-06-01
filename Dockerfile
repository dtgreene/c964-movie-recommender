# Build the frontend
FROM node:24-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY vite.config.js ./
COPY runtime/client ./runtime/client
RUN npm run build

# Runner
FROM python:3.14-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
COPY pyproject.toml uv.lock ./
RUN uv sync

# Download the model, it's uploaded with each release on GitHub.
COPY docker-download-model.sh ./
RUN sh docker-download-model.sh

COPY runtime/server-py ./runtime/server-py
COPY --from=builder /app/runtime/server-py/public ./runtime/server-py/public

EXPOSE 8080
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080", "--app-dir", "runtime/server-py"]
