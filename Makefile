COMPOSE ?= docker compose
COMPOSE_DIR ?= my-collection-search

# Detect OS for platform-specific overrides
UNAME_S := $(shell uname -s)
ifeq ($(UNAME_S),Darwin)
	PLATFORM_OVERRIDE := -f $(COMPOSE_DIR)/docker-compose.mac.yml
else
	PLATFORM_OVERRIDE :=
endif

# Timestamped release tag like v20250112T153045Z
TAG_PREFIX ?= v
TAG_TIME ?= $(shell date -u +%Y%m%dT%H%M%SZ)
TAG ?= $(TAG_PREFIX)$(TAG_TIME)

.PHONY: tag tag-push compose-dev compose-prod compose-down compose-logs compose-dev-mac
.PHONY: build-app build-essentia build-ga-service build-download-worker build-all

tag:
	@# Refuse to tag if the working tree is dirty
	@git status --porcelain | grep . >/dev/null && { echo "Working tree not clean. Commit or stash changes first."; exit 1; } || true
	@if git show-ref --tags --quiet $(TAG); then echo "Tag $(TAG) already exists"; exit 1; fi
	@echo "Creating tag $(TAG)"
	git tag $(TAG)

tag-push: tag
	git push origin $(TAG)

compose-dev:
	$(COMPOSE) -f $(COMPOSE_DIR)/docker-compose.yml -f $(COMPOSE_DIR)/docker-compose.dev.yml $(PLATFORM_OVERRIDE) up

compose-dev-mac:
	$(COMPOSE) -f $(COMPOSE_DIR)/docker-compose.yml -f $(COMPOSE_DIR)/docker-compose.dev.yml -f $(COMPOSE_DIR)/docker-compose.mac.yml up

compose-prod:
	$(COMPOSE) -f $(COMPOSE_DIR)/docker-compose.yml -f $(COMPOSE_DIR)/docker-compose.prod.yml up

compose-down:
	$(COMPOSE) -f $(COMPOSE_DIR)/docker-compose.yml -f $(COMPOSE_DIR)/docker-compose.prod.yml down

compose-logs:
	$(COMPOSE) -f $(COMPOSE_DIR)/docker-compose.yml -f $(COMPOSE_DIR)/docker-compose.prod.yml logs -f

# Local Docker builds (non-push). Set TAG to override.
build-app:
	docker buildx build -t ghcr.io/saegey/myapp:$(TAG) -f $(COMPOSE_DIR)/Dockerfile $(COMPOSE_DIR)

build-essentia:
	docker buildx build -t ghcr.io/saegey/essentia-api:$(TAG) -f essentia-api/Dockerfile essentia-api

build-ga-service:
	docker buildx build -t ghcr.io/saegey/ga-service:$(TAG) -f ga-service/Dockerfile ga-service

build-download-worker:
	docker buildx build -t ghcr.io/saegey/download-worker:$(TAG) -f $(COMPOSE_DIR)/Dockerfile.download-worker $(COMPOSE_DIR)

build-all: build-app build-essentia build-ga-service build-download-worker
