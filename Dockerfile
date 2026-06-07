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

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
COPY pyproject.toml uv.lock ./
RUN uv sync --no-dev --no-cache

COPY runtime/server ./runtime/server
COPY --from=builder /app/runtime/server/public ./runtime/server/public


EXPOSE 5005
CMD ["uv", "run", "--no-sync", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5005", "--app-dir", "runtime/server"]
