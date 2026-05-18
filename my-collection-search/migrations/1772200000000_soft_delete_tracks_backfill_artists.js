export const shorthands = undefined;

export const up = (pgm) => {
  // Add soft-delete timestamp column to tracks
  pgm.sql(`
    ALTER TABLE tracks
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
  `);

  // Index for filtering out deleted tracks efficiently
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_tracks_deleted_at
    ON tracks (deleted_at)
    WHERE deleted_at IS NOT NULL;
  `);

  // Backfill: strip Discogs numeric artist disambiguation suffixes, e.g. "New Order (2)" → "New Order"
  pgm.sql(`
    UPDATE tracks
    SET artist = trim(regexp_replace(artist, '\\s*\\(\\d+\\)\\s*$', ''))
    WHERE artist ~ '\\(\\d+\\)\\s*$';
  `);

  pgm.sql(`
    UPDATE albums
    SET artist = trim(regexp_replace(artist, '\\s*\\(\\d+\\)\\s*$', ''))
    WHERE artist ~ '\\(\\d+\\)\\s*$';
  `);
};

export const down = (pgm) => {
  pgm.sql(`DROP INDEX IF EXISTS idx_tracks_deleted_at;`);
  pgm.sql(`ALTER TABLE tracks DROP COLUMN IF EXISTS deleted_at;`);
};
