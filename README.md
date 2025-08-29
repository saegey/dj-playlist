# Vinyl Playlist Maker Pro Edition

![screenshot](https://github.com/saegey/personal-blog/blob/main/content/projects/vinyl-playlist-maker/vinylapp1.gif?raw=true)

A full-stack Next.js app for managing, analyzing, and syncing vinyl music collections with Discogs, Apple Music, and more. Includes audio analysis, metadata enrichment, and robust backup/restore features.

## Features
- Next.js frontend with Chakra UI
- PostgreSQL database (managed via Docker Compose)
- MeiliSearch for fast search
- Audio analysis via Essentia microservice (FastAPI, Python)
- Discogs, Apple Music, and SoundCloud integration
- Metadata enrichment and bulk editing
- Database backup and restore (with web UI)
- Friends' collection sync and collaboration
- Docker Compose for orchestration (dev and prod)

## Project Structure
- `src/` — Next.js app and API routes
- `migrations/` — node-pg-migrate migration scripts
- `essentia-api/` — Python FastAPI microservice for audio analysis
- `docker-compose.yml` — Production Compose config
- `docker-compose.dev.yml` — Development Compose overrides
- `public/` — Static assets
- `audio/` — Uploaded and processed audio files
- `dumps/` — Database backups

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 20+

### Development
1. Copy `.env.example` to `.env` and fill in secrets.
2. Build and start services:
   ```sh
   docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
   ```
3. Access the app at [http://localhost:3000](http://localhost:3000)

### Production
1. Build and start services:
   ```sh
   docker compose up --build
   ```
2. Access the app at [http://localhost:3000](http://localhost:3000)

## Database Migrations
- Migrations are managed with [node-pg-migrate](https://github.com/salsita/node-pg-migrate).
- Migration files are in `migrations/` and ordered by timestamp.
- To run migrations manually:
  ```sh
  docker compose run migrate
  ```

## Backup & Restore
- Backup: Use the web UI or POST `/api/backup` to create a SQL dump in `dumps/`.
- Restore: Use the web UI or POST a SQL file to `/api/restore`.
- For a full restore, remove the DB volume first:
  ```sh
  docker compose down -v
  docker compose up db
  # Then restore via UI or API
  ```

## Audio Analysis
- Audio files are processed and stored in `/audio`.
- Essentia microservice runs in its own container (`essentia-api`).
- Analysis results are saved to the database and indexed in MeiliSearch.

## Environment Variables
- See `.env.example` for all required variables (Discogs, Apple Music, MeiliSearch, DB, etc).

## Dev vs Prod
- Use `docker-compose.dev.yml` for development (hot reload, local volumes).
- Use only `docker-compose.yml` for production.

## Contributing
PRs and issues welcome!

## License
MIT
