# syntax=docker/dockerfile:1.7
# Use Node base image with Debian Bookworm (Python 3.11)
FROM node:20-bookworm

# Install system dependencies (with cached apt) and ensure lockfiles are cleared
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
  --mount=type=cache,target=/var/lib/apt/lists,sharing=locked \
  rm -f /var/lib/apt/lists/lock /var/cache/apt/archives/lock && \
  apt-get update && \
  apt-get install -y wget gnupg2 && \
  echo "deb http://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" > /etc/apt/sources.list.d/pgdg.list && \
  wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - && \
  apt-get update && \
  apt-get install -y \
  git \
  ffmpeg \
  mediainfo \
  postgresql-client-15 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Node deps (cache npm downloads)
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --ignore-scripts

# Copy app code
COPY . .
RUN rm -rf public tmp dumps

ENV NODE_ENV=production

ARG MEILISEARCH_HOST
ARG MEILISEARCH_API_KEY

ENV MEILISEARCH_HOST=$MEILISEARCH_HOST
ENV MEILISEARCH_EXTERNAL_HOST=$MEILISEARCH_EXTERNAL_HOST
ENV MEILISEARCH_API_KEY=$MEILISEARCH_API_KEY

# Build Next.js
RUN --mount=type=cache,target=/app/.next/cache \
  MEILISEARCH_HOST=$MEILISEARCH_HOST \
  MEILISEARCH_API_KEY=$MEILISEARCH_API_KEY \
  npm run build
# Expose Next.js default port
EXPOSE 3000

# Start app
CMD ["npm", "start"]
