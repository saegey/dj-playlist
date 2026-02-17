/**
 * Add composer field to tracks table
 * Composer information from audio file metadata (ID3 tags, etc.)
 */

exports.up = (pgm) => {
  pgm.addColumn('tracks', {
    composer: {
      type: 'text',
      notNull: false,
      comment: 'Composer name(s) from audio file metadata'
    }
  });

  // Create index for searching by composer
  pgm.createIndex('tracks', 'composer', {
    name: 'idx_tracks_composer'
  });
};

exports.down = (pgm) => {
  pgm.dropIndex('tracks', 'composer', { name: 'idx_tracks_composer', ifExists: true });
  pgm.dropColumn('tracks', 'composer');
};
