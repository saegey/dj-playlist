# syntax=docker/dockerfile:1.7
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
  pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "ga_service:app", "--host", "0.0.0.0", "--port", "8002"]
