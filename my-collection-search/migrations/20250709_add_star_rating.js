exports.up = (pgm) => {
  pgm.addColumn('tracks', {
    star_rating: { type: 'integer', default: null }
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('tracks', 'star_rating');
};
