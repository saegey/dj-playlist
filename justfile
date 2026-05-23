set shell := ["bash", "-euo", "pipefail", "-c"]

compose_dir := env_var_or_default("COMPOSE_DIR", "my-collection-search")
buildkit_env := env_var_or_default("BUILDKIT_ENV", "DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1")
registry := env_var_or_default("REGISTRY", "ghcr.io/saegey")
platform := env_var_or_default("PLATFORM", "linux/amd64")
prod_host := env_var_or_default("PROD_HOST", "vinyl.local")
prod_stack_dir := env_var_or_default("PROD_STACK_DIR", "/opt/stacks/dj-playlist")
ssh_user := env_var_or_default("SSH_USER", "saegey")
tag_prefix := env_var_or_default("TAG_PREFIX", "v")
tag_time := `date -u +%Y%m%dT%H%M%SZ`
tag := env_var_or_default("TAG", tag_prefix + tag_time)
album_covers_remote_host := env_var_or_default("ALBUM_COVERS_REMOTE_HOST", ssh_user + "@" + prod_host)
album_covers_remote_path := env_var_or_default("ALBUM_COVERS_REMOTE_PATH", "/var/lib/docker/volumes/teststack_album_covers/_data")
album_covers_local_dir := env_var_or_default("ALBUM_COVERS_LOCAL_DIR", "/Users/saegey/groovenet-covers")
compose_cmd := `if docker compose version >/dev/null 2>&1; then echo "docker compose"; elif command -v docker-compose >/dev/null 2>&1; then echo "docker-compose"; fi`
platform_override := if os() == "macos" { "-f " + compose_dir + "/docker-compose.mac.yml" } else { "" }

default:
  @just --list

check-compose:
  @if [ -z "{{compose_cmd}}" ]; then \
    echo "Docker Compose is not available."; \
    echo "Install Docker Compose v2 ('docker compose') or docker-compose, then retry."; \
    exit 1; \
  fi

tag:
  @git status --porcelain | grep . >/dev/null && { echo "Working tree not clean. Commit or stash changes first."; exit 1; } || true
  @if git show-ref --tags --quiet {{tag}}; then echo "Tag {{tag}} already exists"; exit 1; fi
  @echo "Creating tag {{tag}}"
  git tag {{tag}}

tag-push: tag
  git push origin {{tag}}

compose-dev: check-compose
  {{buildkit_env}} {{compose_cmd}} -f {{compose_dir}}/docker-compose.yml -f {{compose_dir}}/docker-compose.dev.yml {{platform_override}} up --remove-orphans

compose-dev-mac: check-compose
  {{buildkit_env}} {{compose_cmd}} -f {{compose_dir}}/docker-compose.yml -f {{compose_dir}}/docker-compose.dev.yml -f {{compose_dir}}/docker-compose.mac.yml up --remove-orphans

compose-dev-reset: check-compose
  {{compose_cmd}} -f {{compose_dir}}/docker-compose.yml -f {{compose_dir}}/docker-compose.dev.yml {{platform_override}} down --remove-orphans
  {{buildkit_env}} {{compose_cmd}} -f {{compose_dir}}/docker-compose.yml -f {{compose_dir}}/docker-compose.dev.yml {{platform_override}} up --build --force-recreate --remove-orphans

compose-prod: check-compose
  {{buildkit_env}} {{compose_cmd}} -f {{compose_dir}}/docker-compose.yml -f {{compose_dir}}/docker-compose.prod.yml up

compose-down: check-compose
  {{compose_cmd}} -f {{compose_dir}}/docker-compose.yml -f {{compose_dir}}/docker-compose.prod.yml down

compose-logs: check-compose
  {{compose_cmd}} -f {{compose_dir}}/docker-compose.yml -f {{compose_dir}}/docker-compose.prod.yml logs -f

build-app:
  {{buildkit_env}} docker buildx build -t ghcr.io/saegey/myapp:{{tag}} -f {{compose_dir}}/Dockerfile {{compose_dir}}

build-essentia:
  {{buildkit_env}} docker buildx build -t ghcr.io/saegey/essentia-api:{{tag}} -f essentia-api/Dockerfile essentia-api

build-ga-service:
  {{buildkit_env}} docker buildx build -t ghcr.io/saegey/ga-service:{{tag}} -f ga-service/Dockerfile ga-service

build-download-worker:
  {{buildkit_env}} docker buildx build -t ghcr.io/saegey/download-worker:{{tag}} -f {{compose_dir}}/Dockerfile.download-worker {{compose_dir}}

build-all: build-app build-essentia build-ga-service build-download-worker

build-packages:
  npm run build --workspace=packages/groovenet-client
  npm run build --workspace=packages/groovenet-cli
  npm run build --workspace=mcp-server

push-images:
  {{buildkit_env}} docker buildx build --platform {{platform}} --push -t {{registry}}/myapp:{{tag}} -f {{compose_dir}}/Dockerfile {{compose_dir}}
  {{buildkit_env}} docker buildx build --platform {{platform}} --push -t {{registry}}/essentia-api:{{tag}} -f essentia-api/Dockerfile essentia-api
  {{buildkit_env}} docker buildx build --platform {{platform}} --push -t {{registry}}/ga-service:{{tag}} -f ga-service/Dockerfile ga-service
  {{buildkit_env}} docker buildx build --platform {{platform}} --push -t {{registry}}/download-worker:{{tag}} -f {{compose_dir}}/Dockerfile.download-worker {{compose_dir}}

deploy-prod-local:
  cd {{compose_dir}} && ./scripts/deploy-prod.sh {{tag}}

deploy-prod-remote:
  ssh {{prod_host}} 'set -euo pipefail; cd {{prod_stack_dir}}; if [ -x ./scripts/deploy-prod.sh ]; then ./scripts/deploy-prod.sh {{tag}}; elif [ -x ./my-collection-search/scripts/deploy-prod.sh ]; then ./my-collection-search/scripts/deploy-prod.sh {{tag}}; else echo "deploy-prod.sh not found"; exit 127; fi'

release: tag-push push-images deploy-prod-remote

deploy-prod-remote-localbuild:
  ssh {{prod_host}} 'set -euo pipefail; cd {{prod_stack_dir}}; if [ -x ./scripts/deploy-prod-localbuild.sh ]; then ./scripts/deploy-prod-localbuild.sh {{tag}}; elif [ -x ./my-collection-search/scripts/deploy-prod-localbuild.sh ]; then ./my-collection-search/scripts/deploy-prod-localbuild.sh {{tag}}; else echo "deploy-prod-localbuild.sh not found"; exit 127; fi'

release-localbuild: tag-push deploy-prod-remote-localbuild

migrate-up: check-compose
  {{compose_cmd}} -f {{compose_dir}}/docker-compose.yml run --rm migrate

migrate-down: check-compose
  {{compose_cmd}} -f {{compose_dir}}/docker-compose.yml run --rm migrate npx node-pg-migrate down

migrate-create NAME:
  @if [ -z "{{NAME}}" ]; then echo "Usage: just migrate-create <name>"; exit 1; fi
  cd {{compose_dir}} && npm run migrate create {{NAME}}

sync-album-covers:
  ./{{compose_dir}}/scripts/sync-album-covers.sh \
    "{{album_covers_remote_host}}" \
    "{{album_covers_remote_path}}" \
    "{{album_covers_local_dir}}"
