# syntax=docker/dockerfile:1.7
# Build context: project root (needed to access packages/groovenet-python)
FROM python:3.12-slim

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt/lists,sharing=locked \
    rm -f /var/lib/apt/lists/lock /var/cache/apt/archives/lock && \
    apt-get update && apt-get install -y \
    ffmpeg \
    mediainfo \
    git \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Copy the local groovenet client so uv can resolve the path dependency
COPY packages/groovenet-python /app/packages/groovenet-python

# Copy worker project files and install deps
COPY download-worker/pyproject.toml download-worker/uv.lock /app/download-worker/

WORKDIR /app/download-worker

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-install-project

ENV PATH="/app/download-worker/.venv/bin:$PATH"

COPY download-worker/ /app/download-worker/

RUN mkdir -p /app/audio /app/downloads

CMD ["python", "download_worker.py"]
