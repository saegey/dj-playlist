/**
 * The saved custom palette: its base preset and five colours per mode, as
 * JSON. Validated in code on write and again on read; null means none is saved.
 *
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.addColumns("appearance_settings", {
    custom_palette: { type: "jsonb" },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropColumns("appearance_settings", ["custom_palette"]);
};
