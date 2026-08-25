# Multi-stage build: Node builds the SPA, Python serves everything.
# Shared by both Render services (web + cron) — the cron job overrides
# CMD to run runner.py instead of gunicorn (see render.yaml).

FROM node:22-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/
WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen

COPY . .
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

EXPOSE 5050
CMD ["sh", "-c", "uv run gunicorn app:app --bind 0.0.0.0:${PORT:-5050}"]
