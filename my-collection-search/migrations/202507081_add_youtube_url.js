exports.up = (pgm) => {
  pgm.addColumn('tracks', {
        youtube_url: { type: 'text' } // Added youtube_url column
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('tracks', 'youtube_url');
};
