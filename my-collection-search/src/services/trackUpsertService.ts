import { Pool } from "pg";
import { DiscogsTrack } from "@/types/track";

export async function upsertTracks(pool: Pool, tracks: DiscogsTrack[]): Promise<DiscogsTrack[]> {
  const upserted: DiscogsTrack[] = [];
  for (const track of tracks) {
    const { rows: insertedRows } = await pool.query(
      `
      INSERT INTO tracks (
        track_id, title, artist, album, year,
        styles, genres, duration, position,
        discogs_url, album_thumbnail,
        bpm, key, notes, local_tags,
        apple_music_url, duration_seconds, username
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,
        $10,$11,$12,$13,$14,$15,$16,$17,$18
      )
      ON CONFLICT (track_id, username)
      DO UPDATE SET
        discogs_url     = EXCLUDED.discogs_url,
        album_thumbnail = EXCLUDED.album_thumbnail
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
