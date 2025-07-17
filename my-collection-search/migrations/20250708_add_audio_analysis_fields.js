exports.up = (pgm) => {
  pgm.addColumns('tracks', {
    bpm: { type: 'varchar(10)', default: null }, // This line remains unchanged
    key: { type: 'varchar(10)', default: null },
    duration_seconds: { type: 'integer' }
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('tracks', ['bpm', 'key', 'duration_seconds']);
};
