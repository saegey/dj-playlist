exports.up = (pgm) => {
  pgm.addColumn('tracks', {
    username: { type: 'varchar(255)' }
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('tracks', 'username');
};
