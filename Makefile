COMPOSE ?= docker compose
COMPOSE_DIR ?= my-collection-search

# Timestamped release tag like v20250112T153045Z
TAG_PREFIX ?= v
TAG_TIME ?= $(shell date -u +%Y%m%dT%H%M%SZ)
TAG ?= $(TAG_PREFIX)$(TAG_TIME)

.PHONY: tag tag-push compose-dev compose-prod compose-down compose-logs

tag:
	@# Refuse to tag if the working tree is dirty
	@git status --porcelain | grep . >/dev/null && { echo "Working tree not clean. Commit or stash changes first."; exit 1; } || true
	@if git show-ref --tags --quiet $(TAG); then echo "Tag $(TAG) already exists"; exit 1; fi
	@echo "Creating tag $(TAG)"
	git tag $(TAG)

tag-push: tag
	git push origin $(TAG)

compose-dev:
	$(COMPOSE) -f $(COMPOSE_DIR)/docker-compose.yml -f $(COMPOSE_DIR)/docker-compose.dev.yml up

compose-prod:
	$(COMPOSE) -f $(COMPOSE_DIR)/docker-compose.yml -f $(COMPOSE_DIR)/docker-compose.prod.yml up

compose-down:
	$(COMPOSE) -f $(COMPOSE_DIR)/docker-compose.yml -f $(COMPOSE_DIR)/docker-compose.prod.yml down

compose-logs:
	$(COMPOSE) -f $(COMPOSE_DIR)/docker-compose.yml -f $(COMPOSE_DIR)/docker-compose.prod.yml logs -f
