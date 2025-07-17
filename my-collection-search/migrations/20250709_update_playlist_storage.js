exports.up = (pgm) => {
  // Example: If you changed the type of 'tracks' column in playlists
  pgm.alterColumn('playlists', 'tracks', { type: 'text[]', notNull: true });
  // Add your actual migration logic here
};

exports.down = (pgm) => {
  // Revert the change
  pgm.alterColumn('playlists', 'tracks', { type: 'text', notNull: true });
  // Add your actual revert logic here
};
