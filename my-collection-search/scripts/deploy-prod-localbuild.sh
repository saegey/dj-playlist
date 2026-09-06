#!/usr/bin/env bash
set -euo pipefail

TAG="${1:-}"
if [[ -z "${TAG}" ]]; then
  echo "Usage: $0 <tag>"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
cd "${PROJECT_DIR}"

PROJECT_NAME="${PROJECT_NAME:-dj-playlist}"
COMPOSE_FILES=(-f docker-compose.yml -f docker-compose.prod.yml)
if [[ -f "${PROJECT_DIR}/.env" ]]; then
  COMPOSE_ENV_FILE="${PROJECT_DIR}/.env"
elif [[ -f "${PROJECT_DIR}/my-collection-search/.env" ]]; then
  COMPOSE_ENV_FILE="${PROJECT_DIR}/my-collection-search/.env"
else
  COMPOSE_ENV_FILE=""
fi
if [[ -f "${PROJECT_DIR}/.env.tpl" ]]; then
  COMPOSE_TEMPLATE_FILE="${PROJECT_DIR}/.env.tpl"
elif [[ -f "${PROJECT_DIR}/my-collection-search/.env.tpl" ]]; then
  COMPOSE_TEMPLATE_FILE="${PROJECT_DIR}/my-collection-search/.env.tpl"
else
  COMPOSE_TEMPLATE_FILE=""
fi
OP_BIN="$(command -v op || true)"
COMPOSE_CMD=()
if [[ -n "${COMPOSE_ENV_FILE}" ]]; then
  COMPOSE_CMD=(docker compose --env-file "${COMPOSE_ENV_FILE}")
elif [[ -n "${COMPOSE_TEMPLATE_FILE}" && -n "${OP_BIN}" ]]; then
  COMPOSE_CMD=(op run --env-file "${COMPOSE_TEMPLATE_FILE}" -- docker compose)
else
  COMPOSE_CMD=(docker compose)
fi
BUILD_SERVICES=(app essentia ga-service download-worker)
NAMED_CONTAINERS=(webapp essentia-api ga-service download-worker)
MIN_FREE_GB="${MIN_FREE_GB:-5}"
PGUSER="${POSTGRES_USER:-djplaylist}"
PGDB="${POSTGRES_DB:-djplaylist}"
APP_IMAGE="ghcr.io/saegey/webapp:${IMAGE_TAG:-latest}"
MIGRATE_IMAGE="ghcr.io/saegey/webapp-migrate:${IMAGE_TAG:-latest}"
EXPECTED_APP_CMD='["npm","run","start"]'

latest_migration_name() {
  find "${PROJECT_DIR}/my-collection-search/migrations" -maxdepth 1 -name '*.js' -type f \
    -exec basename {} .js \; | sort | tail -n 1
}

app_image_id() {
  docker image inspect "${APP_IMAGE}" --format '{{.Id}}' 2>/dev/null || true
}

verify_image_tags_do_not_collide() {
  if [[ "${APP_IMAGE}" == "${MIGRATE_IMAGE}" ]]; then
    echo "ERROR: app and migrate image tags must be different"
    exit 1
  fi
}

verify_app_image_cmd() {
  local cmd
  cmd="$(docker image inspect "${APP_IMAGE}" --format '{{json .Config.Cmd}}' 2>/dev/null || true)"
  if [[ "${cmd}" != "${EXPECTED_APP_CMD}" ]]; then
    echo "ERROR: built app image has unexpected Cmd: ${cmd}"
    exit 1
  fi
}

remove_stale_app_image_if_needed() {
  local cmd
  cmd="$(docker image inspect "${APP_IMAGE}" --format '{{json .Config.Cmd}}' 2>/dev/null || true)"
  if [[ -n "${cmd}" && "${cmd}" != "${EXPECTED_APP_CMD}" ]]; then
    echo "==> Removing stale app image ${APP_IMAGE} with unexpected Cmd ${cmd}"
    docker image rm -f "${APP_IMAGE}"
  fi
}

verify_running_app_container() {
  local expected_image_id actual_image_id actual_cmd
  expected_image_id="$(app_image_id)"
  actual_image_id="$(docker inspect webapp --format '{{.Image}}' 2>/dev/null || true)"
  actual_cmd="$(docker inspect webapp --format '{{json .Config.Cmd}}' 2>/dev/null || true)"

  if [[ -z "${expected_image_id}" ]]; then
    echo "ERROR: unable to resolve built app image id for ${APP_IMAGE}"
    exit 1
  fi

  if [[ "${actual_image_id}" != "${expected_image_id}" ]]; then
    echo "ERROR: running webapp container does not use the freshly built image"
    echo "Expected image id: ${expected_image_id}"
    echo "Actual image id:   ${actual_image_id}"
    exit 1
  fi

  if [[ "${actual_cmd}" != "${EXPECTED_APP_CMD}" ]]; then
    echo "ERROR: running webapp container has unexpected Cmd: ${actual_cmd}"
    exit 1
  fi
}

verify_latest_migration_applied() {
  local migration_name applied
  migration_name="$(latest_migration_name)"
  applied="$("${COMPOSE_CMD[@]}" -p "${PROJECT_NAME}" "${COMPOSE_FILES[@]}" exec -T db \
    psql -U "${PGUSER}" -d "${PGDB}" -tAc \
    "SELECT EXISTS(SELECT 1 FROM pgmigrations WHERE name = '${migration_name}')" | tr -d ' ' || echo "f")"
  if [[ "${applied}" != "t" ]]; then
    echo "ERROR: latest migration ${migration_name} is not recorded in pgmigrations"
    exit 1
  fi
}

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

remove_stale_named_containers() {
  local existing=()
  for name in "${NAMED_CONTAINERS[@]}"; do
    if docker ps -a --format '{{.Names}}' | grep -Fxq "${name}"; then
      existing+=("${name}")
    fi
  done

  if (( ${#existing[@]} > 0 )); then
    echo "==> Removing stale named containers: ${existing[*]}"
    docker rm -f "${existing[@]}"
  fi
}

wait_for_db_ready() {
  local timeout_s=120 elapsed=0
  echo "==> Waiting for PostgreSQL readiness"
  until "${COMPOSE_CMD[@]}" -p "${PROJECT_NAME}" "${COMPOSE_FILES[@]}" exec -T db \
    pg_isready -U "${PGUSER}" -d "${PGDB}" >/dev/null 2>&1; do
    sleep 2
    elapsed=$((elapsed + 2))
    if (( elapsed >= timeout_s )); then
      echo "ERROR: Postgres did not become ready within ${timeout_s}s"
      "${COMPOSE_CMD[@]}" -p "${PROJECT_NAME}" "${COMPOSE_FILES[@]}" logs --tail=200 db || true
      exit 1
    fi
  done
}

echo "==> Fetching tags and checking out ${TAG}"
git fetch --tags
git checkout "${TAG}"

if [[ -n "${COMPOSE_ENV_FILE}" ]]; then
  echo "==> Using env file ${COMPOSE_ENV_FILE}"
elif [[ -n "${COMPOSE_TEMPLATE_FILE}" && -n "${OP_BIN}" ]]; then
  echo "==> Using 1Password template ${COMPOSE_TEMPLATE_FILE}"
else
  echo "WARNING: no .env or usable .env.tpl found"
fi

echo "==> Checking disk space"
check_disk_space

verify_image_tags_do_not_collide
remove_stale_app_image_if_needed

echo "==> Building images locally on server"
"${COMPOSE_CMD[@]}" -p "${PROJECT_NAME}" "${COMPOSE_FILES[@]}" build "${BUILD_SERVICES[@]}"
verify_app_image_cmd

echo "==> Starting database dependencies"
"${COMPOSE_CMD[@]}" -p "${PROJECT_NAME}" "${COMPOSE_FILES[@]}" up -d db redis
wait_for_db_ready

echo "==> Running migrations"
"${COMPOSE_CMD[@]}" -p "${PROJECT_NAME}" "${COMPOSE_FILES[@]}" run --build --rm --use-aliases migrate
verify_latest_migration_applied

echo "==> Starting services"
remove_stale_named_containers
"${COMPOSE_CMD[@]}" -p "${PROJECT_NAME}" "${COMPOSE_FILES[@]}" up -d --force-recreate --remove-orphans
verify_running_app_container

echo "==> Deployment complete"
