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
  // Create albums table
  pgm.createTable("albums", {
    // Primary key: compound (release_id, friend_id) to support multi-user collections
    release_id: {
      type: "varchar(255)",
      notNull: true,
    },
    friend_id: {
      type: "integer",
      notNull: true,
      references: "friends(id)",
    },

    // Album metadata from Discogs
    title: {
      type: "varchar(255)",
      notNull: true,
    },
    artist: {
      type: "varchar(255)",
      notNull: true,
    },
    year: "varchar(10)",
    genres: "text[]",
    styles: "text[]",
    album_thumbnail: "text",
    discogs_url: "text",

    // Discogs collection metadata
    date_added: {
      type: "timestamp",
      notNull: false,
    },
    date_changed: {
      type: "timestamp",
      notNull: false,
    },

    // Track count
    track_count: {
      type: "integer",
      default: 0,
    },

    // User-editable album-specific fields
    album_rating: {
      type: "integer",
      default: 0,
    },
    album_notes: {
      type: "text",
      default: "",
    },
    purchase_price: {
      type: "decimal(10,2)",
      notNull: false,
    },
    condition: {
      type: "varchar(50)",
      notNull: false,
    },

    // Additional metadata
    label: "varchar(255)",
    catalog_number: "varchar(100)",
    country: "varchar(100)",
    format: "varchar(100)",

    // Timestamps
    created_at: {
      type: "timestamp",
      default: pgm.func("current_timestamp"),
    },
    updated_at: {
      type: "timestamp",
      default: pgm.func("current_timestamp"),
    },
  });

  // Create compound primary key
  pgm.addConstraint("albums", "albums_pk", {
    primaryKey: ["release_id", "friend_id"],
  });

  // Create indexes for common queries
  pgm.createIndex("albums", "friend_id", {
    name: "idx_albums_friend_id",
  });

  pgm.createIndex("albums", "date_added", {
    name: "idx_albums_date_added",
  });

  pgm.createIndex("albums", "release_id", {
    name: "idx_albums_release_id",
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable("albums");
};
