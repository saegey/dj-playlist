/**
 * Migration: Add library_identifier to tracks table
 * Purpose: Support alphanumeric library identifiers for physical vinyl organization
 * Identifiers are inherited from albums or manually assigned
 *
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  // Add library_identifier column (VARCHAR for alphanumeric support)
  pgm.addColumn("tracks", {
    library_identifier: {
      type: "varchar(50)",
      notNull: false, // Nullable - usually inherited from album
    },
  });

  // Create index for filtering by library identifier
  pgm.createIndex("tracks", "library_identifier", {
    name: "idx_tracks_library_identifier",
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  // Drop in reverse order
  pgm.dropIndex("tracks", "library_identifier", {
    name: "idx_tracks_library_identifier",
  });
  pgm.dropColumn("tracks", "library_identifier");
};
