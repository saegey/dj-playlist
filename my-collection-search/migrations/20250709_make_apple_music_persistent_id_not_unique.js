exports.up = (pgm) => {
  pgm.alterColumn('tracks', 'apple_music_persistent_id', {
    unique: false
  });
};

exports.down = (pgm) => {
  pgm.alterColumn('tracks', 'apple_music_persistent_id', {
    unique: true
  });
};
