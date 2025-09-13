# Friend ID Migration Guide

This document outlines the migration process for adding `friend_id` columns to normalize database references.

## Overview

**Problem:** Currently, `tracks` and `playlist_tracks` tables use `username` strings to identify friends. This is problematic because:
- Usernames can change, breaking references
- String comparisons are less efficient than integer foreign keys
- No referential integrity constraints

**Solution:** Add `friend_id` integer foreign key columns that reference `friends.id`.

## Migration Process

### Step 1: Run the Migration

```bash
# Run the migration
docker-compose run --rm migrate

# Or manually:
npm run migrate
```

The migration (`1737641200000_add_friend_id_columns.js`) will:
1. Add `friend_id` columns to both `tracks` and `playlist_tracks` tables
2. Create foreign key constraints to `friends.id`
3. Create indexes for performance
4. Populate `friend_id` values based on existing `username` data
5. Set NOT NULL constraints after data population

### Step 2: Validate Migration

```bash
# Run the validation script
node scripts/validate-friend-id-migration.js
```

This will check:
- All tracks have `friend_id` populated
- All playlist_tracks have `friend_id` populated  
- `friend_id` values match corresponding `username` values
- Referential integrity between tables
- Display summary statistics

### Step 3: Update Application Code (Future)

The migration keeps `username` columns for backwards compatibility. Future application updates will:

1. **Update TypeScript types:**
```typescript
interface Track {
  track_id: string;
  username: string; // Keep for compatibility
  friend_id: number; // New field
  // ...
}
```

2. **Update track store keys:**
```typescript
// Current: key = `${track_id}:${username}`  
// Future:  key = `${track_id}:${friend_id}`
```

3. **Update services to populate both fields:**
```typescript
// Services should include friend_id in responses
// Queries should prefer friend_id over username
```

4. **Update ingestion jobs:**
```typescript
// Include friend_id lookup when ingesting tracks
const friend = await getFriendByUsername(username);
trackData.friend_id = friend.id;
```

## Rollback Plan

If issues are discovered after migration:

```bash
# Restore from database backup
docker-compose down
docker-compose run --rm db_restore backup_file.sql
docker-compose up
```

Or run the down migration:
```bash
# This will remove friend_id columns
npm run migrate down 1737641200000
```

## Validation Queries

Manual validation queries you can run:

```sql
-- Check for missing friend_id values
SELECT COUNT(*) FROM tracks WHERE friend_id IS NULL;
SELECT COUNT(*) FROM playlist_tracks WHERE friend_id IS NULL;

-- Verify username/friend_id consistency  
SELECT t.username, f.username, COUNT(*)
FROM tracks t
JOIN friends f ON t.friend_id = f.id
WHERE t.username != f.username
GROUP BY t.username, f.username;

-- Check playlist_tracks consistency
SELECT COUNT(*) FROM playlist_tracks pt
JOIN tracks t ON pt.track_id = t.track_id
WHERE pt.friend_id != t.friend_id;
```

## Files Created

- `migrations/1737641200000_add_friend_id_columns.js` - Main migration
- `scripts/validate-friend-id-migration.js` - Validation script
- `MIGRATION_FRIEND_ID.md` - This documentation
- Updated `CLAUDE.md` - Schema documentation

## Benefits After Migration

1. **Data Integrity:** Foreign key constraints ensure referential integrity
2. **Performance:** Integer joins faster than string comparisons
3. **Flexibility:** Usernames can change without breaking references  
4. **Consistency:** Single source of truth for friend relationships
5. **Future-proof:** Better foundation for multi-user features

## Timeline

- **Phase 1:** Database migration (immediate)
- **Phase 2:** Application code updates (gradual)
- **Phase 3:** Remove username columns (future cleanup)

The migration is designed to be non-breaking and can be deployed immediately.