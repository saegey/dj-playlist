exports.up = (pgm) => {
  // Example: Add position column to playlist tracks if you have a join table
  pgm.addColumn('playlist_tracks', {
    position: { type: 'integer' }
  });
  // Add your actual migration logic here
};

exports.down = (pgm) => {
  pgm.dropColumn('playlist_tracks', 'position');
  // Add your actual revert logic here
};
