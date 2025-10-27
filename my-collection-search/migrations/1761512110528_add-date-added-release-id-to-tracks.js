/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  // Add release_id to tracks table (Discogs release ID for linking to albums)
  pgm.addColumn("tracks", {
    release_id: {
      type: "varchar(255)",
      notNull: false,
    },
  });

  // Add date_added to tracks table (when added to Discogs collection)
  pgm.addColumn("tracks", {
    date_added: {
      type: "timestamp",
      notNull: false,
    },
  });

  // Backfill release_id from track_id
  // track_id format is: {release_id}-{position}
  // Extract the release_id portion (everything before the first dash)
  pgm.sql(`
    UPDATE tracks
    SET release_id = SPLIT_PART(track_id, '-', 1)
    WHERE release_id IS NULL OR release_id = '';
  `);

  // Create index on release_id for faster album-track lookups
  pgm.createIndex("tracks", "release_id", {
    name: "idx_tracks_release_id",
  });

  // Create index on date_added for sorting by recently added
  pgm.createIndex("tracks", "date_added", {
    name: "idx_tracks_date_added",
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropIndex("tracks", "date_added", {
    name: "idx_tracks_date_added",
  });
  pgm.dropIndex("tracks", "release_id", {
    name: "idx_tracks_release_id",
  });
  pgm.dropColumn("tracks", "date_added");
  pgm.dropColumn("tracks", "release_id");
};
