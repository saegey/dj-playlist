/**
 * Digital plays from the player daemon (#653) are spins too, labelled by
 * `medium` so vinyl stats can stay vinyl-only.
 *
 * The unique index makes a replayed log idempotent: one digital session per
 * friend, release and start time. A reconnecting or restarted daemon that
 * posts the same play again gets a conflict instead of a duplicate.
 */
export const up = (pgm) => {
  pgm.dropConstraint("spin_sessions", "spin_sessions_medium_check");
  pgm.addConstraint("spin_sessions", "spin_sessions_medium_check", {
    check: "medium IN ('vinyl', 'digital')",
  });
  pgm.createIndex("spin_sessions", ["friend_id", "release_id", "played_at"], {
    name: "spin_sessions_digital_play_unique",
    unique: true,
    where: "medium = 'digital'",
  });
};

export const down = (pgm) => {
  pgm.dropIndex("spin_sessions", ["friend_id", "release_id", "played_at"], {
    name: "spin_sessions_digital_play_unique",
  });
  pgm.sql("DELETE FROM spin_sessions WHERE medium = 'digital'");
  pgm.dropConstraint("spin_sessions", "spin_sessions_medium_check");
  pgm.addConstraint("spin_sessions", "spin_sessions_medium_check", {
    check: "medium IN ('vinyl')",
  });
};
