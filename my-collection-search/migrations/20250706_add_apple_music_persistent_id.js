exports.up = (pgm) => {
  pgm.addColumn('tracks', {
    apple_music_persistent_id: { type: 'varchar(32)', unique: true, default: null }
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('tracks', 'apple_music_persistent_id');
};
