exports.up = (pgm) => {
  pgm.addColumn('tracks', {
        soundcloud_url: { type: 'text' } // Added soundcloud_url column
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('tracks', 'soundcloud_url');
};
