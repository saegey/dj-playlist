# Playlist Friend ID Implementation Plan

## Backend API Fixes Required

### 1. Update createPlaylistWithTracks function

**File:** `src/app/api/playlists/route.ts` (Line 36-56)

**Current Issue:** Missing friend_id in INSERT statement
```sql
-- Current (broken after migration)
INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES ...

-- Needed
INSERT INTO playlist_tracks (playlist_id, track_id, friend_id, position) VALUES ...
```

**Solution Options:**

#### Option A: Add default_friend_id parameter (Backwards Compatible)
```typescript
async function createPlaylistWithTracks(data: {
  name: string;
  tracks: string[];
  default_friend_id?: number;
}) {
  // Get friend_id from parameter or default to first friend
  const friendId = data.default_friend_id || await getDefaultFriendId();
  
  if (tracks && tracks.length > 0) {
    const values = tracks
      .map((trackId, i) => `($1, $${i + 2}, $${tracks.length + i + 2}, ${i})`)
      .join(",");
    const query = `INSERT INTO playlist_tracks (playlist_id, track_id, friend_id, position) VALUES ${values}`;
    const params = [playlist.id, ...tracks, ...tracks.map(() => friendId)];
    await pool.query(query, params);
  }
}
```

#### Option B: Accept track objects with friend_id
```typescript
interface PlaylistTrack {
  track_id: string;
  friend_id: number;
}

async function createPlaylistWithTracks(data: {
  name: string;
  tracks: (string | PlaylistTrack)[];
  default_friend_id?: number;
})
```

### 2. Update PATCH handler

**File:** `src/app/api/playlists/route.ts` (Line 154-161)

**Current Issue:** Missing friend_id in track replacement
```typescript
// Current (broken)
const values = tracks.map((_, i) => `($1, $${i + 2}, ${i})`).join(',');
const insertSql = `INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES ${values}`;

// Needed
const values = tracks.map((_, i) => `($1, $${i + 2}, $${tracks.length + i + 2}, ${i})`).join(',');
const insertSql = `INSERT INTO playlist_tracks (playlist_id, track_id, friend_id, position) VALUES ${values}`;
```

### 3. Add helper function for friend resolution

```typescript
async function getDefaultFriendId(): Promise<number> {
  const result = await pool.query('SELECT id FROM friends ORDER BY id LIMIT 1');
  if (result.rows.length === 0) {
    throw new Error('No friends found');
  }
  return result.rows[0].id;
}

async function resolveFriendIdForTrack(trackId: string, username?: string): Promise<number> {
  if (username) {
    const result = await pool.query('SELECT id FROM friends WHERE username = $1', [username]);
    if (result.rows.length > 0) {
      return result.rows[0].id;
    }
  }
  
  // Fallback: find any friend who has this track
  const result = await pool.query(
    'SELECT friend_id FROM tracks WHERE track_id = $1 LIMIT 1', 
    [trackId]
  );
  if (result.rows.length > 0) {
    return result.rows[0].friend_id;
  }
  
  return await getDefaultFriendId();
}
```

## Frontend Service Updates

### 1. Update importPlaylist service

**File:** `src/services/playlistService.ts`

```typescript
export async function importPlaylist(
  name: string, 
  tracks: string[],
  friendId?: number
) {
  const res = await fetch("/api/playlists", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      name, 
      tracks,
      default_friend_id: friendId 
    }),
  });
  return res;
}
```

### 2. Update updatePlaylist service

```typescript
export async function updatePlaylist(
  id: number, 
  data: { 
    name?: string; 
    tracks?: string[];
    default_friend_id?: number;
  }
) {
  const res = await fetch("/api/playlists", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...data }),
  });
  return res;
}
```

## Application Logic Updates

### 1. Queue Save Dialog

**File:** `src/hooks/useQueueSaveDialog.tsx`

```typescript
export function useQueueSaveDialog() {
  const { playlist } = usePlaylistPlayer();
  
  const onConfirm = React.useCallback(async (finalName: string) => {
    const trackIds = playlist.map(track => track.track_id);
    
    // Determine friend_id from first track or default
    const friendId = playlist[0]?.friend_id || await getDefaultFriendId();
    
    const res = await importPlaylist(finalName.trim(), trackIds, friendId);
    // ...
  }, [playlist]);
}
```

### 2. Playlist Save Dialog

**File:** `src/hooks/usePlaylistSaveDialog.tsx`

```typescript
// When updating existing playlist, preserve friend context
const handleSave = React.useCallback(async (finalName?: string) => {
  const trackIds = getTrackIds();
  
  if (playlistId) {
    // For updates, we need to determine friend_id from existing tracks
    const friendId = await getFriendIdFromPlaylist(playlistId);
    res = await updatePlaylist(playlistId, { tracks: trackIds, default_friend_id: friendId });
  }
  // ...
}, [playlistId, queryClient]);
```

## Migration Considerations

### Immediate Fixes (Required)
1. Fix `createPlaylistWithTracks` - add default_friend_id parameter
2. Fix PATCH handler - add friend_id to INSERT
3. Update frontend services to pass friendId

### Future Enhancements
1. Support mixed friend playlists
2. Add UI to select friend when saving
3. Track-level friend selection in playlist editor

## Rollout Strategy

### Phase 1: Backend Fixes (Critical)
- Fix broken INSERT statements
- Add default_friend_id support
- Test with existing functionality

### Phase 2: Frontend Updates
- Update service calls
- Add friend context to save operations
- Test queue and playlist save functions

### Phase 3: Enhanced Features (Future)
- Multi-friend playlist support
- Friend selection UI
- Advanced playlist management

## Testing Checklist

- [ ] Create new playlist from queue
- [ ] Update existing playlist tracks
- [ ] Save playlist from PlaylistViewer
- [ ] Genetic/greedy sort and save
- [ ] Verify friend_id consistency in database
- [ ] Test with multiple friends