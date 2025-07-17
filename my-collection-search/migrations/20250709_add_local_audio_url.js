exports.up = (pgm) => {
  pgm.addColumn('tracks', {
    local_audio_url: { type: 'text', notNull: true }
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('tracks', 'local_audio_url');
};
