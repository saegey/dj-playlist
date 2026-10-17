# syntax=docker/dockerfile:1.7

FROM node:26-bookworm-slim AS base
# All stages inherit the app's exact npm pin, checked against mise in CI.
COPY my-collection-search/package.json /tmp/npm-toolchain.json
RUN npm install -g "npm@$(node -p "require('/tmp/npm-toolchain.json').engines.npm")" && \
    test "$(npm --version)" = "$(node -p "require('/tmp/npm-toolchain.json').engines.npm")"

FROM base AS deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY packages ./packages
COPY mcp-server/package.json ./mcp-server/package.json
RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts
RUN npm run build --workspace=@groovenet/contracts
COPY my-collection-search/package*.json ./my-collection-search/
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefix my-collection-search --ignore-scripts

FROM base AS builder
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/my-collection-search/node_modules ./my-collection-search/node_modules
COPY . .
# The Docker context excludes generated build directories. Restore the contracts
# output produced in `deps` so local package exports resolve in Storybook/Vite.
COPY --from=deps /repo/packages/groovenet-contracts/build ./packages/groovenet-contracts/build
WORKDIR /repo/my-collection-search
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Build from this checkout before Next.js inventories public files. Releases,
# CI candidates and local image builds all package the same verified bundle.
ENV STORYBOOK_DISABLE_TELEMETRY=1
RUN npm run build-storybook
RUN --mount=type=cache,target=/repo/my-collection-search/.next/cache \
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

WORKDIR /app/my-collection-search

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Next.js standalone output (next.config.mjs: output: "standalone"): a
# self-contained server with a traced, minimal node_modules — far smaller than
# copying the full dependency tree, so much less to build/push per image.
COPY --from=builder --chown=nextjs:nodejs /repo/my-collection-search/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/my-collection-search/.next/static ./my-collection-search/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/my-collection-search/public ./my-collection-search/public

# Every path a named volume mounts over has to exist here first. Docker seeds a
# new volume's ownership from the image, so a path missing from this list is
# created root-owned and the app — running as nextjs — cannot write to it.
# `audio-ingest` was missing, and the ingest route (#275) failed every upload
# with EACCES while reporting a 500 the listener device politely retried.
#
# The symlinks that used to live here (pointing app code's process.cwd()-relative
# reads — cookies, dumps, discogs_exports, audio, audio-ingest, essentia-data,
# public/uploads/album-covers — at these volumes) moved to entrypoint.sh: Next's
# generated standalone server.js runs `process.chdir(__dirname)` at startup,
# which is the nested directory outputFileTracingRoot produces
# (/app/my-collection-search/my-collection-search, not this WORKDIR), so a
# symlink created here at build time was never where the running server
# actually looked. entrypoint.sh finds that real directory at container start
# instead of hardcoding it.
RUN mkdir -p /app/cookies /app/dumps /app/discogs_exports /app/audio /app/audio-ingest /app/essentia-data /app/public/uploads/album-covers && \
    chown -R nextjs:nodejs /app

COPY --chmod=755 my-collection-search/entrypoint.sh /entrypoint.sh

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
# outputFileTracingRoot (next.config.mjs) points at the monorepo root, so
# Next's standalone output nests this app's own server.js one level deeper
# than this WORKDIR — but WORKDIR must stay here: cookieUtils.ts and
# backupStatusService.ts resolve their directories off process.cwd(), which
# only lines up with the volume symlinks below (cookies, dumps, ...) at this
# level. `node <path>` doesn't change cwd, so this keeps both correct.
CMD ["node", "my-collection-search/server.js"]

FROM deps AS migrator
WORKDIR /repo/my-collection-search

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
COPY my-collection-search/migrations ./migrations
COPY my-collection-search/scripts ./scripts
COPY my-collection-search/src/server/genres/taxonomySeed.js ./src/server/genres/taxonomySeed.js

# Verify every migration can load in the deployed image before publishing it.
# Database-only tests on the checkout cannot detect missing image dependencies.
RUN node --input-type=module -e "import { readdir } from 'node:fs/promises'; for (const file of await readdir('./migrations')) { if (file.endsWith('.js')) await import('./migrations/' + file); }"

# One-off maintenance scripts (src/scripts/*.ts), e.g. backfill-key-confidence
# (#524). Built on demand only — not part of the CI publish pipeline, and not
# started by a plain `docker compose up` (see its `scripts` profile). Reuses
# `deps`'s node_modules, which still has devDependencies (tsx) at this point
# in the build, before `builder`/`runner` set NODE_ENV=production.
FROM base AS scripts
WORKDIR /repo/my-collection-search
COPY --from=deps /repo/node_modules /repo/node_modules
COPY --from=deps /repo/my-collection-search/node_modules ./node_modules
COPY my-collection-search/package*.json my-collection-search/tsconfig.json ./
COPY my-collection-search/src ./src
