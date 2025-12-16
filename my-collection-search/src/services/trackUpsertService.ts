import { Pool } from "pg";
import { DiscogsTrack } from "@/types/track";

export async function upsertTracks(pool: Pool, tracks: DiscogsTrack[]): Promise<DiscogsTrack[]> {
  // 1) Ensure all friends exist and build username -> friend_id map
  const usernames = Array.from(
    new Set(tracks.map((t) => t.username).filter((u): u is string => !!u))
  );

  if (usernames.length) {
    // Insert any missing friends
    await pool.query(
      `INSERT INTO friends (username)
       SELECT UNNEST($1::text[])
       ON CONFLICT (username) DO NOTHING`,
      [usernames]
    );
  }

  const friendMap = new Map<string, number>();
  if (usernames.length) {
    const { rows } = await pool.query(
      `SELECT id, username FROM friends WHERE username = ANY($1::text[])`,
      [usernames]
    );
    for (const r of rows) friendMap.set(r.username, r.id);
  }

  // 2) Upsert tracks with resolved friend_id
  const upserted: DiscogsTrack[] = [];
  for (const track of tracks) {
    let friendId: number | undefined = friendMap.get(track.username);
    if (!friendId) {
      // Fallback: create/select friend for this username on the fly
      const { rows: inserted } = await pool.query(
        `INSERT INTO friends (username) VALUES ($1)
         ON CONFLICT (username) DO NOTHING
         RETURNING id`,
        [track.username]
      );
      if (inserted.length) {
        const id: number = inserted[0].id;
        friendId = id;
        friendMap.set(track.username, id);
      } else {
        const { rows: got } = await pool.query(
          `SELECT id FROM friends WHERE username = $1`,
          [track.username]
        );
        if (got.length) {
          const id: number = got[0].id;
          friendId = id;
          friendMap.set(track.username, id);
        }
      }
    }

    if (!friendId) {
      console.warn(
        `[Discogs Index] Could not resolve friend_id for username='${track.username}'. Skipping ${track.track_id}`
      );
      continue;
    }

    const { rows: insertedRows } = await pool.query(
      `
      INSERT INTO tracks (
        track_id, title, artist, album, year,
        styles, genres, duration, position,
        discogs_url, album_thumbnail,
        bpm, key, notes, local_tags,
        apple_music_url, duration_seconds, username, friend_id, release_id
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,
        $10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20
      )
      ON CONFLICT (track_id, username)
      DO UPDATE SET
        title           = EXCLUDED.title,
        artist          = EXCLUDED.artist,
        album           = EXCLUDED.album,
        year            = EXCLUDED.year,
        styles          = EXCLUDED.styles,
        genres          = EXCLUDED.genres,
        duration        = EXCLUDED.duration,
        position        = EXCLUDED.position,
        discogs_url     = EXCLUDED.discogs_url,
        album_thumbnail = EXCLUDED.album_thumbnail,
        apple_music_url = EXCLUDED.apple_music_url,
        duration_seconds = EXCLUDED.duration_seconds,
        friend_id       = EXCLUDED.friend_id,
        release_id      = EXCLUDED.release_id
      RETURNING *;
      `,
      [
        track.track_id,
        track.title,
        track.artist,
        track.album,
        track.year,
        track.styles,
        track.genres,
        track.duration,
        track.position,
        track.discogs_url,
        track.album_thumbnail,
        track.bpm,
        track.key,
        track.notes,
        track.local_tags,
        track.apple_music_url,
        track.duration_seconds,
        track.username,
        friendId,
        track.release_id,
      ]
    );
    if (insertedRows.length !== 1) {
      console.warn(
        `[Discogs Index] Expected 1 row for ${track.track_id}@${track.username}, got ${insertedRows.length}`
      );
    }
    upserted.push(insertedRows[0]);
  }
  return upserted;
}
