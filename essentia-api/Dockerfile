# syntax=docker/dockerfile:1.7
FROM ghcr.io/mgoltzsche/essentia

RUN apk add --no-cache python3

COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app
COPY pyproject.toml uv.lock ./

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-install-project

ENV PATH="/app/.venv/bin:$PATH"

COPY essentia_api.py .

EXPOSE 8001
CMD ["uvicorn", "essentia_api:app", "--host", "0.0.0.0", "--port", "8001"]
