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

RUN pip install --no-cache-dir -r requirements.txt

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

ARG NEXT_PUBLIC_MEILISEARCH_API_KEY
ENV NEXT_PUBLIC_MEILISEARCH_API_KEY=$NEXT_PUBLIC_MEILISEARCH_API_KEY
ARG NEXT_PUBLIC_MEILISEARCH_HOST
ENV NEXT_PUBLIC_MEILISEARCH_HOST=$NEXT_PUBLIC_MEILISEARCH_HOST

ARG OPENAI_API_KEY
ENV OPENAI_API_KEY=$OPENAI_API_KEY

ARG DISCOGS_USERNAME
ENV DISCOGS_USERNAME=$DISCOGS_USERNAME
ARG DISCOGS_FOLDER_ID
ENV DISCOGS_FOLDER_ID=$DISCOGS_FOLDER_ID
ARG DISCOGS_API_KEY
ENV DISCOGS_API_KEY=$DISCOGS_API_KEY

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

ARG YOUTUBE_API_KEY
ENV YOUTUBE_API_KEY=$YOUTUBE_API_KEY

ARG APPLE_MUSIC_API_KEY
ENV APPLE_MUSIC_API_KEY=$APPLE_MUSIC_API_KEY
ARG APPLE_MUSIC_TEAM_ID
ENV APPLE_MUSIC_TEAM_ID=$APPLE_MUSIC_TEAM_ID
ARG APPLE_MUSIC_KEY_ID
ENV APPLE_MUSIC_KEY_ID=$APPLE_MUSIC_KEY_ID

# Build Next.js
RUN npm run build

# Expose Next.js default port
EXPOSE 3000

# Start app
CMD ["npm", "start"]