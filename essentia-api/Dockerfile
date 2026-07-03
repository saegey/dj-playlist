# syntax=docker/dockerfile:1.7
FROM ghcr.io/mgoltzsche/essentia

RUN apk add --no-cache python3

COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

ENV UV_PROJECT_ENVIRONMENT=/opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app
COPY pyproject.toml uv.lock ./

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-install-project

COPY essentia_api.py .

EXPOSE 8001
CMD ["python", "-m", "uvicorn", "essentia_api:app", "--host", "0.0.0.0", "--port", "8001"]
