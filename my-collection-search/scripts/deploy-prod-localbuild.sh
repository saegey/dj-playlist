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
BUILD_SERVICES=(app essentia ga-service download-worker)
MIN_FREE_GB="${MIN_FREE_GB:-5}"
PGUSER="${POSTGRES_USER:-djplaylist}"
PGDB="${POSTGRES_DB:-djplaylist}"

check_disk_space() {
  local avail_kb required_kb
  avail_kb="$(df -Pk "${PROJECT_DIR}" | awk 'NR==2 {print $4}')"
  required_kb=$((MIN_FREE_GB * 1024 * 1024))
  if (( avail_kb < required_kb )); then
    echo "ERROR: low disk space. Need >= ${MIN_FREE_GB}GB free before deploy."
    echo "Available: $((avail_kb / 1024 / 1024))GB"
    exit 1
  fi
}

wait_for_db_ready() {
  local timeout_s=120 elapsed=0
  echo "==> Waiting for PostgreSQL readiness"
  until docker compose -p "${PROJECT_NAME}" "${COMPOSE_FILES[@]}" exec -T db \
    pg_isready -U "${PGUSER}" -d "${PGDB}" >/dev/null 2>&1; do
    sleep 2
    elapsed=$((elapsed + 2))
    if (( elapsed >= timeout_s )); then
      echo "ERROR: Postgres did not become ready within ${timeout_s}s"
      docker compose -p "${PROJECT_NAME}" "${COMPOSE_FILES[@]}" logs --tail=200 db || true
      exit 1
    fi
  done
}

echo "==> Fetching tags and checking out ${TAG}"
git fetch --tags
git checkout "${TAG}"

echo "==> Checking disk space"
check_disk_space

echo "==> Building images locally on server"
docker compose -p "${PROJECT_NAME}" "${COMPOSE_FILES[@]}" build "${BUILD_SERVICES[@]}"

echo "==> Starting database dependencies"
docker compose -p "${PROJECT_NAME}" "${COMPOSE_FILES[@]}" up -d db redis
wait_for_db_ready

echo "==> Running migrations"
docker compose -p "${PROJECT_NAME}" "${COMPOSE_FILES[@]}" run --rm --use-aliases migrate

echo "==> Starting services"
docker compose -p "${PROJECT_NAME}" "${COMPOSE_FILES[@]}" up -d --force-recreate --remove-orphans

echo "==> Deployment complete"
