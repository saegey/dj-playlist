# Use Node base image with Debian Bookworm (Python 3.11)
FROM node:20-bookworm

# Install system dependencies
RUN apt-get update && \
  apt-get install -y wget gnupg2 && \
  echo "deb http://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" > /etc/apt/sources.list.d/pgdg.list && \
  wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - && \
  apt-get update && \
  apt-get install -y \
  git \
  postgresql-client-15 \
  && rm -rf /var/lib/apt/lists/*

# Copy app code
WORKDIR /app
COPY . .
RUN rm -rf public tmp dumps

# Install Node deps
RUN npm install

ARG MEILISEARCH_HOST
ARG MEILISEARCH_API_KEY

ENV MEILISEARCH_HOST=$MEILISEARCH_HOST
ENV MEILISEARCH_EXTERNAL_HOST=$MEILISEARCH_EXTERNAL_HOST
ENV MEILISEARCH_API_KEY=$MEILISEARCH_API_KEY

# Build Next.js
RUN MEILISEARCH_HOST=$MEILISEARCH_HOST \
  MEILISEARCH_API_KEY=$MEILISEARCH_API_KEY \
  npm run build
# Expose Next.js default port
EXPOSE 3000

# Start app
CMD ["npm", "start"]