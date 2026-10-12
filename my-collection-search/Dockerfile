# syntax=docker/dockerfile:1.7

FROM node:26-bookworm-slim AS base
# All stages inherit the app's exact npm pin, checked against mise in CI.
COPY package.json /tmp/npm-toolchain.json
RUN npm install -g "npm@$(node -p "require('/tmp/npm-toolchain.json').engines.npm")" && \
    test "$(npm --version)" = "$(node -p "require('/tmp/npm-toolchain.json').engines.npm")"

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Build from this checkout before Next.js inventories public files. Releases,
# CI candidates and local image builds all package the same verified bundle.
ENV STORYBOOK_DISABLE_TELEMETRY=1
RUN npm run build-storybook
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

FROM base AS runner

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt/lists,sharing=locked \
    apt-get update && \
    apt-get install -y --no-install-recommends curl gnupg ca-certificates && \
    install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /etc/apt/keyrings/postgresql.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/postgresql.gpg] http://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" > /etc/apt/sources.list.d/pgdg.list && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian bookworm stable" > /etc/apt/sources.list.d/docker.list && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
      git \
      ffmpeg \
      mediainfo \
      restic \
      postgresql-client-16 \
      docker-ce-cli \
      gosu

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs -m nextjs

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Next.js standalone output (next.config.mjs: output: "standalone"): a
# self-contained server with a traced, minimal node_modules — far smaller than
# copying the full dependency tree, so much less to build/push per image.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Every path a named volume mounts over has to exist here first. Docker seeds a
# new volume's ownership from the image, so a path missing from this list is
# created root-owned and the app — running as nextjs — cannot write to it.
# `audio-ingest` was missing, and the ingest route (#275) failed every upload
# with EACCES while reporting a 500 the listener device politely retried.
RUN mkdir -p cookies dumps discogs_exports audio audio-ingest essentia-data public/uploads/album-covers && \
    chown -R nextjs:nodejs /app

COPY --chmod=755 entrypoint.sh /entrypoint.sh

# Build metadata surfaced by the About page (/api/version). Kept last so these
# per-commit values don't invalidate the cache of the COPY/apt layers above.
ARG GIT_SHA
ARG BUILD_TIME
ARG APP_VERSION
ENV GIT_SHA=$GIT_SHA
ENV BUILD_TIME=$BUILD_TIME
ENV APP_VERSION=$APP_VERSION

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "server.js"]

FROM base AS migrator
WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts
RUN --mount=type=cache,target=/root/.npm \
    npm install -g node-pg-migrate@8.0.4

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt/lists,sharing=locked \
    apt-get update && \
    apt-get install -y --no-install-recommends curl gnupg ca-certificates && \
    install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /etc/apt/keyrings/postgresql.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/postgresql.gpg] http://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" > /etc/apt/sources.list.d/pgdg.list && \
    apt-get update && \
    apt-get install -y --no-install-recommends postgresql-client-15
# Migrations run without the Next.js source tree. Copy their runtime inputs
# directly so this target does not depend on an application build.
COPY migrations ./migrations
COPY scripts ./scripts
COPY src/server/genres/taxonomySeed.js ./src/server/genres/taxonomySeed.js

# Verify every migration can load in the deployed image before publishing it.
# Database-only tests on the checkout cannot detect missing image dependencies.
RUN node --input-type=module -e "import { readdir } from 'node:fs/promises'; for (const file of await readdir('./migrations')) { if (file.endsWith('.js')) await import('./migrations/' + file); }"

# One-off maintenance scripts (src/scripts/*.ts), e.g. backfill-key-confidence
# (#524). Built on demand only — not part of the CI publish pipeline, and not
# started by a plain `docker compose up` (see its `scripts` profile). Reuses
# `deps`'s node_modules, which still has devDependencies (tsx) at this point
# in the build, before `builder`/`runner` set NODE_ENV=production.
FROM base AS scripts
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json tsconfig.json ./
COPY src ./src
