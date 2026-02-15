#!/usr/bin/env bash
set -euo pipefail

TAG="${1:-}"
if [[ -z "${TAG}" ]]; then
  echo "Usage: $0 <tag>"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_DIR}"

PROJECT_NAME="${PROJECT_NAME:-dj-playlist}"
COMPOSE_FILES=(-f docker-compose.yml -f docker-compose.prod.yml)
SERVICES=(app migrate essentia ga-service download-worker)

echo "==> Fetching tags and checking out ${TAG}"
git fetch --tags
git checkout "${TAG}"

echo "==> Pulling images for ${TAG}"
IMAGE_TAG="${TAG}" docker compose -p "${PROJECT_NAME}" "${COMPOSE_FILES[@]}" pull "${SERVICES[@]}"

echo "==> Running migrations"
IMAGE_TAG="${TAG}" docker compose -p "${PROJECT_NAME}" "${COMPOSE_FILES[@]}" run --rm migrate

echo "==> Starting services"
IMAGE_TAG="${TAG}" docker compose -p "${PROJECT_NAME}" "${COMPOSE_FILES[@]}" up -d --remove-orphans

echo "==> Deployment complete"
