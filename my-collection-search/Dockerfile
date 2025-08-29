# Use Node base image
FROM node:20-bullseye

# Install system dependencies
RUN apt-get update && \
  apt-get install -y wget gnupg2 && \
  echo "deb http://apt.postgresql.org/pub/repos/apt bullseye-pgdg main" > /etc/apt/sources.list.d/pgdg.list && \
  wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - && \
  apt-get update && \ 
  apt-get install -y \
  ffmpeg \
  python3 \
  python3-pip \
  git \
  atomicparsley \
  postgresql-client-15 \
  && rm -rf /var/lib/apt/lists/*

# Install youtube-dl
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt || echo "pip failed, ignoring"

# Install Freyr
RUN npm install -g git+https://github.com/miraclx/freyr-js.git

# --- Essentia ---
# Building Essentia from source is complex.
# You may need to clone and build if you need advanced analysis.
# Example placeholder if you want to install:
# RUN git clone https://github.com/MTG/essentia.git \
#   && cd essentia \
#   && git submodule update --init --recursive \
#   && mkdir build \
#   && cd build \
#   && cmake .. \
#   && make -j$(nproc) \
#   && make install

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