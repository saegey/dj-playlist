export const shorthands = undefined;

export function up(pgm) {
  pgm.alterColumn("tracks", "key", {
    type: "varchar(255)",
    default: null,
  });
}

export function down(pgm) {
  pgm.alterColumn("tracks", "key", {
    type: "varchar(10)",
    default: null,
  });
}
