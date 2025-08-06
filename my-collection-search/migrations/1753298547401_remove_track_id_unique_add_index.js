export const shorthands = undefined;

export function up(pgm) {
  // Remove unique constraint on track_id
  pgm.dropConstraint('tracks', 'tracks_track_id_key');
  // Add a non-unique index on track_id
  pgm.createIndex('tracks', ['track_id'], { unique: false, name: 'tracks_track_id_idx' });
};

export function down(pgm) {
  // Remove the non-unique index
  pgm.dropIndex('tracks', ['track_id'], { name: 'tracks_track_id_idx' });
  // Restore the unique constraint
  pgm.addConstraint('tracks', 'tracks_track_id_key', {
    unique: ['track_id'],
  });
};
