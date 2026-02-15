# Music Identity Embeddings

## Overview

This system implements "music identity" embeddings for tracks using OpenAI's `text-embedding-3-small` model and PostgreSQL's pgvector extension. Identity embeddings capture the musical essence of tracks based on metadata (genre, style, era, country, labels, tags) while **excluding** DJ-specific notes and function tags.

This is the **first of 2-3 embedding types** planned for the system:
1. **Identity** (implemented) — Musical identity based on metadata
2. **Audio Vibe** (future) — Audio characteristics (BPM, key, mood, danceability)
3. **DJ Function** (future) — DJ use-case and notes

---

## Architecture

### Database Schema

#### `track_embeddings` Table

Stores multiple types of embeddings per track with source hashing for efficient updates.

```sql
CREATE TABLE track_embeddings (
  id SERIAL PRIMARY KEY,
  track_id VARCHAR(255) NOT NULL,
  friend_id INTEGER NOT NULL REFERENCES friends(id) ON DELETE CASCADE,
  embedding_type embedding_type_enum NOT NULL, -- 'identity', 'audio_vibe', 'dj_function'
  model VARCHAR(100) NOT NULL DEFAULT 'text-embedding-3-small',
  dims INTEGER NOT NULL DEFAULT 1536,
  embedding VECTOR(1536) NOT NULL,
  source_hash VARCHAR(64) NOT NULL,
  identity_text TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (track_id, friend_id, embedding_type)
);

-- Indexes
CREATE INDEX idx_track_embeddings_track_id ON track_embeddings(track_id);
CREATE INDEX idx_track_embeddings_friend_id ON track_embeddings(friend_id);
CREATE INDEX idx_track_embeddings_type ON track_embeddings(embedding_type);

-- Vector similarity index (ivfflat)
CREATE INDEX idx_track_embeddings_vector_cosine
ON track_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### Code Structure

```
src/
├── lib/
│   ├── identity-normalization.ts   # Normalization utilities
│   ├── identity-embedding.ts       # Identity embedding service
│   └── __tests__/
│       ├── identity-normalization.test.ts
│       └── identity-embedding.test.ts
└── app/api/embeddings/
    ├── backfill-identity/route.ts  # Backfill endpoint
    ├── identity-preview/route.ts   # Preview endpoint (debugging)
    └── similar/route.ts             # Similarity query endpoint
```

---

## Identity Embedding Format

### Template

Identity embeddings use a **deterministic, structured template**:

```
Track: {title} — {artist}
Release: {album} ({era_bucket})
Country: {country}
Labels: {label_1, label_2, ...}
Genres: {genres_list}
Styles: {styles_list}
Tags: {local_tags_list}
```

### Example

```
Track: Windowlicker — Aphex Twin
Release: Windowlicker (1990s)
Country: uk
Labels: warp records
Genres: electronic
Styles: idm, experimental, ambient
Tags: melodic, atmospheric
```

### Normalization Rules

1. **Era Bucketing**: Year → `1950s`, `1960s`, ..., `2020s`, `pre-1950s`, or `unknown-era`
2. **Genres/Styles**: Prefer Discogs metadata; fallback to Apple/iTunes genre
3. **Labels**: Max 3 labels (from album metadata)
4. **Country**: From album metadata; fallback to `unknown-country`
5. **Local Tags**: **Filter out DJ-function tags** (see below)
6. **All text**: Lowercase, trimmed, deduplicated, punctuation-normalized

### DJ-Function Tag Filter

These tags are **excluded** from identity embeddings (reserved for future DJ function embeddings):

- `warmup`, `warm-up`, `peak`, `peak-time`, `opener`, `closer`
- `tool`, `left-turn`, `transition`, `banger`
- `long intro`, `short intro`, `intro`, `outro`
- `breakdown`, `buildup`, `drop`, `filler`, `interlude`

Only genre/style/scene descriptor tags are included in identity embeddings.

### Source Hash

A **SHA256 hash** of normalized identity data is computed to detect changes. Tracks are re-embedded only if:
- No embedding exists
- Source hash has changed
- Force update flag is set

---

## API Endpoints

### 1. Backfill Identity Embeddings

**Endpoint**: `POST /api/embeddings/backfill-identity`

**Query Params**:
- `friend_id` (optional): Limit to specific friend/user
- `force` (optional): Force re-embedding even if hash unchanged
- `limit` (optional): Limit number of tracks to process
- `batch_size` (optional): Concurrency limit (default: 5)

**Example**:
```bash
# Backfill all tracks without embeddings
curl -X POST "http://localhost:3000/api/embeddings/backfill-identity"

# Force re-embed first 100 tracks for friend_id=1
curl -X POST "http://localhost:3000/api/embeddings/backfill-identity?friend_id=1&force=true&limit=100"

# Process in larger batches (10 concurrent)
curl -X POST "http://localhost:3000/api/embeddings/backfill-identity?batch_size=10"
```

**Response**:
```json
{
  "message": "Backfill complete",
  "total": 1523,
  "success": 1520,
  "skipped": 0,
  "failed": [
    {
      "track_id": "xyz",
      "friend_id": 1,
      "error": "OpenAI API rate limit"
    }
  ]
}
```

---

### 2. Identity Preview (Debugging)

**Endpoint**: `GET /api/embeddings/identity-preview`

**Query Params**:
- `track_id` (required)
- `friend_id` (required)

**Example**:
```bash
curl "http://localhost:3000/api/embeddings/identity-preview?track_id=12345&friend_id=1"
```

**Response**:
```json
{
  "identityText": "Track: Windowlicker — Aphex Twin\nRelease: Windowlicker (1990s)\n...",
  "identityData": {
    "title": "Windowlicker",
    "artist": "Aphex Twin",
    "album": "Windowlicker",
    "era": "1990s",
    "country": "uk",
    "labels": ["warp records"],
    "genres": ["electronic"],
    "styles": ["idm", "experimental"],
    "tags": ["melodic", "atmospheric"]
  }
}
```

---

### 3. Find Similar Tracks

**Endpoint**: `GET /api/embeddings/similar`

**Query Params**:
- `track_id` (required): Source track
- `friend_id` (required): Source track's friend_id
- `limit` (optional, default 50): Max results
- `era` (optional): Filter by era bucket (e.g., `1990s`)
- `country` (optional): Filter by country (e.g., `uk`)
- `tags` (optional): Comma-separated tags (match any)
- `ivfflat_probes` (optional, default 10): Accuracy/speed tradeoff (higher = more accurate)

**Example**:
```bash
# Find 20 similar tracks from the 1990s
curl "http://localhost:3000/api/embeddings/similar?track_id=12345&friend_id=1&limit=20&era=1990s"

# Find similar UK releases with specific tags
curl "http://localhost:3000/api/embeddings/similar?track_id=12345&friend_id=1&country=uk&tags=melodic,atmospheric"
```

**Response**:
```json
{
  "source_track_id": "12345",
  "source_friend_id": 1,
  "filters": {
    "era": "1990s"
  },
  "count": 20,
  "tracks": [
    {
      "track_id": "67890",
      "friend_id": 1,
      "title": "Similar Track",
      "artist": "Another Artist",
      "album": "Another Album",
      "year": 1998,
      "genres": ["electronic"],
      "styles": ["idm"],
      "local_tags": "melodic",
      "distance": 0.15,
      "identity_text": "Track: Similar Track — Another Artist\n..."
    }
  ]
}
```

**Distance Interpretation**:
- **0.0 - 0.2**: Very similar (near-duplicates, remixes, same artist/style)
- **0.2 - 0.4**: Similar (same genre/style, compatible vibe)
- **0.4 - 0.6**: Somewhat similar (related genres)
- **0.6+**: Distant (different genres/eras)

---

## Running Migrations

### Apply Migration

```bash
# From my-collection-search directory
npm run migrate up

# Or via Docker
docker compose run --rm migrate
```

### Rollback (if needed)

```bash
npm run migrate down
```

---

## Running Tests

```bash
# From my-collection-search directory
npx tsx src/lib/__tests__/identity-normalization.test.ts
npx tsx src/lib/__tests__/identity-embedding.test.ts
```

---

## Usage Workflow

### 1. Run Migration
```bash
npm run migrate up
```

### 2. Backfill Embeddings
```bash
# Start with a small batch to test
curl -X POST "http://localhost:3000/api/embeddings/backfill-identity?limit=10"

# Then backfill all
curl -X POST "http://localhost:3000/api/embeddings/backfill-identity"
```

### 3. Query Similar Tracks
```bash
# Find similar tracks
curl "http://localhost:3000/api/embeddings/similar?track_id=YOUR_TRACK_ID&friend_id=1&limit=20"
```

---

## Performance Tuning

### OpenAI Rate Limits
- Free tier: ~3 requests/minute
- Paid tier: ~3,000 requests/minute
- Adjust `batch_size` accordingly (default: 5 concurrent)

### pgvector Index Tuning
- **`lists` parameter**: Currently 100 (good for <100K tracks)
  - Rule of thumb: `sqrt(total_rows)`
  - For 10K tracks: `lists = 100`
  - For 100K tracks: `lists = 316`
  - For 1M tracks: `lists = 1000`

- **`ivfflat.probes`**: Query-time accuracy knob
  - Default: 10 (fast, ~90% recall)
  - Higher = more accurate but slower
  - Max: `lists` value
  - Example: `SET ivfflat.probes = 20;`

### Re-indexing After Bulk Inserts
```sql
-- Drop and recreate index with new lists value
DROP INDEX idx_track_embeddings_vector_cosine;
CREATE INDEX idx_track_embeddings_vector_cosine
ON track_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 316); -- Adjust based on row count
```

---

## Integration with Existing System

### Differences from Legacy `tracks.embedding`

| Feature | Legacy (`tracks.embedding`) | New (`track_embeddings`) |
|---------|----------------------------|---------------------------|
| Storage | Single column on `tracks` | Separate table |
| Types | One embedding per track | Multiple types (identity, audio, DJ) |
| Source tracking | No hash | SHA256 source hash |
| Update logic | Always re-embed | Skip if hash unchanged |
| DJ notes | Included | Excluded (identity only) |
| Template | User-customizable | Deterministic, type-specific |

### Migration Path

The new system runs **in parallel** with the legacy system:
- Legacy `tracks.embedding` remains unchanged
- New `track_embeddings` table stores typed embeddings
- No breaking changes to existing features

**Future**: Deprecate `tracks.embedding` once all embedding types are implemented.

---

## Roadmap

### Implemented
- ✅ `track_embeddings` table with pgvector
- ✅ Identity embedding generation with normalization
- ✅ Source hashing for efficient updates
- ✅ Backfill API with batching
- ✅ Similarity query API with filters
- ✅ Tests for normalization and hashing

### Future Enhancements
- [ ] **Audio Vibe Embeddings**: BPM, key, danceability, mood scores
- [ ] **DJ Function Embeddings**: DJ notes, use-case tags, set position
- [ ] **Incremental Updates**: Auto-embed on track create/update
- [ ] **Hybrid Search**: Combine identity + audio vibe similarity
- [ ] **UI Integration**: Similar tracks widget on track detail pages
- [ ] **Background Jobs**: Queue embeddings via existing worker system
- [ ] **Batch Similarity**: Find similar tracks for entire playlists

---

## Troubleshooting

### Embedding Not Found Error
```json
{ "error": "Track has no identity embedding. Run backfill first." }
```
**Solution**: Run backfill for that track/friend_id.

### OpenAI Rate Limit Errors
**Solution**: Reduce `batch_size` or add retry logic with exponential backoff.

### Slow Similarity Queries
**Solution**: Increase `ivfflat.probes` or rebuild index with higher `lists` value.

### Source Hash Not Updating
**Solution**: Use `force=true` to bypass hash check.

---

## Credits

- **pgvector**: https://github.com/pgvector/pgvector
- **OpenAI Embeddings**: https://platform.openai.com/docs/guides/embeddings
- **Model**: `text-embedding-3-small` (1536 dimensions)
