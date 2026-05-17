/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.sql("CREATE EXTENSION IF NOT EXISTS pg_trgm;");

  // Tracks: trigram for fuzzy matching and FTS for multi-word lexical ranking.
  pgm.sql(`
    CREATE INDEX idx_tracks_title_trgm
    ON tracks
    USING gin (title gin_trgm_ops);
  `);
  pgm.sql(`
    CREATE INDEX idx_tracks_artist_trgm
    ON tracks
    USING gin (artist gin_trgm_ops);
  `);
  pgm.sql(`
    CREATE INDEX idx_tracks_album_trgm
    ON tracks
    USING gin (album gin_trgm_ops);
  `);

  pgm.sql(`
    CREATE INDEX idx_tracks_search_tsv
    ON tracks
    USING gin (
      to_tsvector(
        'simple',
        coalesce(title, '') || ' ' || coalesce(artist, '') || ' ' || coalesce(album, '')
      )
    );
  `);

  // Albums: trigram + FTS for fuzzy and lexical matching.
  pgm.sql(`
    CREATE INDEX idx_albums_title_trgm
    ON albums
    USING gin (title gin_trgm_ops);
  `);
  pgm.sql(`
    CREATE INDEX idx_albums_artist_trgm
    ON albums
    USING gin (artist gin_trgm_ops);
  `);

  pgm.sql(`
    CREATE INDEX idx_albums_search_tsv
    ON albums
    USING gin (
      to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(artist, ''))
    );
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.sql("DROP INDEX IF EXISTS idx_tracks_title_trgm;");
  pgm.sql("DROP INDEX IF EXISTS idx_tracks_artist_trgm;");
  pgm.sql("DROP INDEX IF EXISTS idx_tracks_album_trgm;");
  pgm.sql("DROP INDEX IF EXISTS idx_tracks_search_tsv;");

  pgm.sql("DROP INDEX IF EXISTS idx_albums_title_trgm;");
  pgm.sql("DROP INDEX IF EXISTS idx_albums_artist_trgm;");
  pgm.sql("DROP INDEX IF EXISTS idx_albums_search_tsv;");
};
