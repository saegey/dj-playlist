/**
 * The app-wide colour palette, shared by every device. One row. The id is
 * checked in code against the palette registry, not here, so a new palette
 * needs no migration.
 *
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.createTable("appearance_settings", {
    id: {
      type: "integer",
      primaryKey: true,
      default: 1,
      check: "id = 1",
    },
    palette: {
      type: "varchar(64)",
      notNull: true,
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropTable("appearance_settings");
};
