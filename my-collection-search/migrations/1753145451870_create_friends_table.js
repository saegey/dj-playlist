export const shorthands = undefined;

export function up(pgm) {
  pgm.createTable("friends", {
    id: {
      type: "serial",
      primaryKey: true,
    },
    username: {
      type: "varchar(255)",
      notNull: true,
      unique: true,
    },
    added_at: {
      type: "timestamp",
      default: pgm.func("current_timestamp"),
    },
  });
}

export function down(pgm) {
  pgm.dropTable("friends");
}
