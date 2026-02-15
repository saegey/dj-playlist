/**
 * Create track_embeddings table to support multiple embedding types
 * (identity, audio vibe, DJ function) with source hashing and metadata.
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  // Create embedding_type enum
  pgm.createType("embedding_type_enum", ["identity", "audio_vibe", "dj_function"]);

  // Create track_embeddings table
  pgm.createTable("track_embeddings", {
    id: {
      type: "serial",
      primaryKey: true,
    },
    track_id: {
      type: "varchar(255)",
      notNull: true,
    },
    friend_id: {
      type: "integer",
      notNull: true,
      references: "friends(id)",
      onDelete: "CASCADE",
    },
    embedding_type: {
      type: "embedding_type_enum",
      notNull: true,
    },
    model: {
      type: "varchar(100)",
      notNull: true,
      default: "text-embedding-3-small",
    },
    dims: {
      type: "integer",
      notNull: true,
      default: 1536,
    },
    embedding: {
      type: "vector(1536)",
      notNull: true,
    },
    source_hash: {
      type: "varchar(64)",
      notNull: true,
    },
    identity_text: {
      type: "text",
      notNull: false,
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  // Create unique constraint on (track_id, friend_id, embedding_type)
  pgm.addConstraint("track_embeddings", "track_embeddings_unique_track_type", {
    unique: ["track_id", "friend_id", "embedding_type"],
  });

  // Create indexes
  pgm.createIndex("track_embeddings", "track_id", {
    name: "idx_track_embeddings_track_id",
  });

  pgm.createIndex("track_embeddings", "friend_id", {
    name: "idx_track_embeddings_friend_id",
  });

  pgm.createIndex("track_embeddings", "embedding_type", {
    name: "idx_track_embeddings_type",
  });

  // Create ivfflat index for vector similarity search
  // lists = 100 is a starting point; tune based on dataset size
  // For < 1M vectors, sqrt(rows) is a good heuristic
  pgm.sql(`
    CREATE INDEX idx_track_embeddings_vector_cosine
    ON track_embeddings
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable("track_embeddings");
  pgm.dropType("embedding_type_enum");
};
