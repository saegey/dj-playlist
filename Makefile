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

.PHONY: tag tag-push compose-dev compose-prod compose-down compose-logs compose-dev-mac
.PHONY: build-app build-essentia build-ga-service build-download-worker build-all
.PHONY: migrate-up migrate-down migrate-create configure-meili reindex-meili
.PHONY: check-compose

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
	$(BUILDKIT_ENV) $(COMPOSE_CMD) -f $(COMPOSE_DIR)/docker-compose.yml -f $(COMPOSE_DIR)/docker-compose.dev.yml $(PLATFORM_OVERRIDE) up

compose-dev-mac: check-compose
	$(BUILDKIT_ENV) $(COMPOSE_CMD) -f $(COMPOSE_DIR)/docker-compose.yml -f $(COMPOSE_DIR)/docker-compose.dev.yml -f $(COMPOSE_DIR)/docker-compose.mac.yml up

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
