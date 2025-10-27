# Backfill Scripts

## backfill-track-release-ids.sql

**Purpose**: Populate the `release_id` field in the `tracks` table from existing `track_id` values.

**When to use**:
- If you upgraded from a version before the `release_id` column was added
- If tracks are not showing up on album detail pages

**How to run**:

```bash
# Using psql
psql $DATABASE_URL -f scripts/backfill-track-release-ids.sql

# Or with docker-compose
docker-compose exec -T db psql -U djplaylist -d djplaylist < scripts/backfill-track-release-ids.sql
```

**What it does**:
- Extracts the release ID from `track_id` (format: `{release_id}-{position}`)
- Updates the `release_id` column for all tracks
- Shows verification stats

**Note**: For new installations, this backfill runs automatically as part of the migration `1761512110528_add-date-added-release-id-to-tracks.js`.

## fix-date-added.ts

**Purpose**: Update `date_added` in Discogs export JSON files to use the correct collection date instead of the Discogs database date.

**When to use**:
- If album `date_added` dates are incorrect (showing when releases were added to Discogs DB, not your collection)

**How to run**:

```bash
# For all users
npx tsx scripts/fix-date-added.ts

# For specific user
npx tsx scripts/fix-date-added.ts username
```

**What it does**:
- Fetches collection data from Discogs API
- Updates `date_added` in all release JSON files
- Respects API rate limits

**Next steps after running**:
1. Clear albums: `curl -X DELETE http://localhost:3000/api/albums/clear`
2. Re-backfill: `curl http://localhost:3000/api/albums/backfill`
