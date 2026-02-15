#!/usr/bin/env bash
set -euo pipefail

TAG="${1:-}"
if [[ -z "${TAG}" ]]; then
  echo "Usage: $0 <tag>"
  exit 1
fi

PROJECT_NAME="${PROJECT_NAME:-dj-playlist}"
COMPOSE_FILES=(-f docker-compose.yml -f docker-compose.prod.yml)
BUILD_SERVICES=(app essentia ga-service download-worker)

echo "==> Fetching tags and checking out ${TAG}"
git fetch --tags
git checkout "${TAG}"

echo "==> Building images locally on server"
docker compose -p "${PROJECT_NAME}" "${COMPOSE_FILES[@]}" build "${BUILD_SERVICES[@]}"

echo "==> Running migrations"
docker compose -p "${PROJECT_NAME}" "${COMPOSE_FILES[@]}" run --rm migrate

echo "==> Starting services"
docker compose -p "${PROJECT_NAME}" "${COMPOSE_FILES[@]}" up -d --force-recreate --remove-orphans

echo "==> Deployment complete"
