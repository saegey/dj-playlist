COMPOSE_CMD ?= $(shell if docker compose version >/dev/null 2>&1; then echo "docker compose"; elif command -v docker-compose >/dev/null 2>&1; then echo "docker-compose"; fi)
COMPOSE_DIR ?= my-collection-search
BUILDKIT_ENV ?= DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1

# Detect OS for platform-specific overrides
UNAME_S := $(shell uname -s)
ifeq ($(UNAME_S),Darwin)
	PLATFORM_OVERRIDE := -f $(COMPOSE_DIR)/docker-compose.mac.yml
else
	PLATFORM_OVERRIDE :=
endif

# Timestamped release tag like v20250112T153045Z
TAG_PREFIX ?= v
TAG_TIME := $(shell date -u +%Y%m%dT%H%M%SZ)
TAG ?= $(TAG_PREFIX)$(TAG_TIME)

.PHONY: tag tag-push compose-dev compose-prod compose-down compose-logs compose-dev-mac compose-dev-reset
.PHONY: build-app build-essentia build-ga-service build-download-worker build-all build-packages
.PHONY: migrate-up migrate-down migrate-create configure-meili reindex-meili
.PHONY: push-images deploy-prod-local deploy-prod-remote deploy-prod-remote-localbuild release release-localbuild
.PHONY: check-compose

REGISTRY ?= ghcr.io/saegey
PLATFORM ?= linux/amd64
PROD_HOST ?= vinyl.local
PROD_STACK_DIR ?= /opt/stacks/dj-playlist

check-compose:
	@if [ -z "$(COMPOSE_CMD)" ]; then \
		echo "Docker Compose is not available."; \
		echo "Install Docker Compose v2 ('docker compose') or docker-compose, then retry."; \
		exit 1; \
	fi

tag:
	@# Refuse to tag if the working tree is dirty
	@git status --porcelain | grep . >/dev/null && { echo "Working tree not clean. Commit or stash changes first."; exit 1; } || true
	@if git show-ref --tags --quiet $(TAG); then echo "Tag $(TAG) already exists"; exit 1; fi
	@echo "Creating tag $(TAG)"
	git tag $(TAG)

tag-push: tag
	git push origin $(TAG)

compose-dev: check-compose
	$(BUILDKIT_ENV) $(COMPOSE_CMD) -f $(COMPOSE_DIR)/docker-compose.yml -f $(COMPOSE_DIR)/docker-compose.dev.yml $(PLATFORM_OVERRIDE) up --remove-orphans

compose-dev-mac: check-compose
	$(BUILDKIT_ENV) $(COMPOSE_CMD) -f $(COMPOSE_DIR)/docker-compose.yml -f $(COMPOSE_DIR)/docker-compose.dev.yml -f $(COMPOSE_DIR)/docker-compose.mac.yml up --remove-orphans

compose-dev-reset: check-compose
	$(COMPOSE_CMD) -f $(COMPOSE_DIR)/docker-compose.yml -f $(COMPOSE_DIR)/docker-compose.dev.yml $(PLATFORM_OVERRIDE) down --remove-orphans
	$(BUILDKIT_ENV) $(COMPOSE_CMD) -f $(COMPOSE_DIR)/docker-compose.yml -f $(COMPOSE_DIR)/docker-compose.dev.yml $(PLATFORM_OVERRIDE) up --build --force-recreate --remove-orphans

compose-prod: check-compose
	$(BUILDKIT_ENV) $(COMPOSE_CMD) -f $(COMPOSE_DIR)/docker-compose.yml -f $(COMPOSE_DIR)/docker-compose.prod.yml up

compose-down: check-compose
	$(COMPOSE_CMD) -f $(COMPOSE_DIR)/docker-compose.yml -f $(COMPOSE_DIR)/docker-compose.prod.yml down

compose-logs: check-compose
	$(COMPOSE_CMD) -f $(COMPOSE_DIR)/docker-compose.yml -f $(COMPOSE_DIR)/docker-compose.prod.yml logs -f

# Local Docker builds (non-push). Set TAG to override.
build-app:
	$(BUILDKIT_ENV) docker buildx build -t ghcr.io/saegey/myapp:$(TAG) -f $(COMPOSE_DIR)/Dockerfile $(COMPOSE_DIR)

build-essentia:
	$(BUILDKIT_ENV) docker buildx build -t ghcr.io/saegey/essentia-api:$(TAG) -f essentia-api/Dockerfile essentia-api

build-ga-service:
	$(BUILDKIT_ENV) docker buildx build -t ghcr.io/saegey/ga-service:$(TAG) -f ga-service/Dockerfile ga-service

build-download-worker:
	$(BUILDKIT_ENV) docker buildx build -t ghcr.io/saegey/download-worker:$(TAG) -f $(COMPOSE_DIR)/Dockerfile.download-worker $(COMPOSE_DIR)

build-all: build-app build-essentia build-ga-service build-download-worker

build-packages:
	npm run build --workspace=packages/groovenet-client
	npm run build --workspace=packages/groovenet-cli
	npm run build --workspace=mcp-server

# Build and push all runtime images for a tag
push-images:
	$(BUILDKIT_ENV) docker buildx build --platform $(PLATFORM) --push -t $(REGISTRY)/myapp:$(TAG) -f $(COMPOSE_DIR)/Dockerfile $(COMPOSE_DIR)
	$(BUILDKIT_ENV) docker buildx build --platform $(PLATFORM) --push -t $(REGISTRY)/essentia-api:$(TAG) -f essentia-api/Dockerfile essentia-api
	$(BUILDKIT_ENV) docker buildx build --platform $(PLATFORM) --push -t $(REGISTRY)/ga-service:$(TAG) -f ga-service/Dockerfile ga-service
	$(BUILDKIT_ENV) docker buildx build --platform $(PLATFORM) --push -t $(REGISTRY)/download-worker:$(TAG) -f $(COMPOSE_DIR)/Dockerfile.download-worker $(COMPOSE_DIR)

# Run a production deployment from inside the server checkout
deploy-prod-local:
	cd $(COMPOSE_DIR) && ./scripts/deploy-prod.sh $(TAG)

# Deploy remotely over SSH (tag checkout + pull + migrate + up)
deploy-prod-remote:
	ssh $(PROD_HOST) 'set -euo pipefail; cd $(PROD_STACK_DIR); if [ -x ./scripts/deploy-prod.sh ]; then ./scripts/deploy-prod.sh $(TAG); elif [ -x ./my-collection-search/scripts/deploy-prod.sh ]; then ./my-collection-search/scripts/deploy-prod.sh $(TAG); else echo "deploy-prod.sh not found"; exit 127; fi'

# End-to-end release from local machine: create/push tag, publish images, deploy remote
release: tag-push push-images deploy-prod-remote

# End-to-end release with server-side builds (no registry push)
deploy-prod-remote-localbuild:
	ssh $(PROD_HOST) 'set -euo pipefail; cd $(PROD_STACK_DIR); if [ -x ./scripts/deploy-prod-localbuild.sh ]; then ./scripts/deploy-prod-localbuild.sh $(TAG); elif [ -x ./my-collection-search/scripts/deploy-prod-localbuild.sh ]; then ./my-collection-search/scripts/deploy-prod-localbuild.sh $(TAG); else echo "deploy-prod-localbuild.sh not found"; exit 127; fi'

release-localbuild: tag-push deploy-prod-remote-localbuild

# Database migrations
migrate-up: check-compose
	$(COMPOSE_CMD) -f $(COMPOSE_DIR)/docker-compose.yml run --rm migrate

migrate-down: check-compose
	$(COMPOSE_CMD) -f $(COMPOSE_DIR)/docker-compose.yml run --rm migrate npx node-pg-migrate down

migrate-create:
	@if [ -z "$(NAME)" ]; then echo "Usage: make migrate-create NAME=my-migration-name"; exit 1; fi
	cd $(COMPOSE_DIR) && npm run migrate create $(NAME)

# MeiliSearch configuration
configure-meili: check-compose
	$(COMPOSE_CMD) -f $(COMPOSE_DIR)/docker-compose.yml exec app node scripts/configure-meilisearch.mjs

reindex-meili: check-compose
	$(COMPOSE_CMD) -f $(COMPOSE_DIR)/docker-compose.yml exec app node scripts/reindex-meilisearch.mjs
