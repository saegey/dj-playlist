/**
 * Migration: Add library_identifier to albums table
 * Purpose: Support alphanumeric library identifiers for physical vinyl organization
 * Identifiers are manually assigned by users (e.g., LP001, LP002)
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
  // 1. Add library_identifier column (VARCHAR for alphanumeric support)
  pgm.addColumn("albums", {
    library_identifier: {
      type: "varchar(50)",
      notNull: false, // Nullable - users assign manually
    },
  });

  // 2. Create index for sorting/filtering by library identifier
  pgm.createIndex("albums", "library_identifier", {
    name: "idx_albums_library_identifier",
  });

  // 3. Create unique partial index: one identifier per friend_id
  // Partial index (WHERE library_identifier IS NOT NULL) allows multiple NULLs
  pgm.createIndex("albums", ["friend_id", "library_identifier"], {
    name: "idx_albums_unique_friend_library_identifier",
    unique: true,
    where: "library_identifier IS NOT NULL",
  });

  // NO backfill - all identifiers start as NULL
  // Users will manually assign via UI as they label physical records
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  // Drop in reverse order
  pgm.dropIndex("albums", ["friend_id", "library_identifier"], {
    name: "idx_albums_unique_friend_library_identifier",
  });
  pgm.dropIndex("albums", "library_identifier", {
    name: "idx_albums_library_identifier",
  });
  pgm.dropColumn("albums", "library_identifier");
};
