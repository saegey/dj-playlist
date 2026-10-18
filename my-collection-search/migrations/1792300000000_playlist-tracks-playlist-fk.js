/**
 * playlist_tracks.playlist_id was created as a bare integer with no foreign
 * key, so deleting a playlist left its playlist_tracks rows behind. The
 * orphans inflated the per-track "N playlists" badge while the popover (which
 * inner-joins playlists) showed nothing (#549).
 *
 * Remove the existing orphans first — the constraint cannot be added while
 * they exist — then add the FK with ON DELETE CASCADE so the invariant holds
 * for any code path that deletes a playlist.
 */
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    DELETE FROM playlist_tracks pt
    WHERE NOT EXISTS (SELECT 1 FROM playlists p WHERE p.id = pt.playlist_id)
  `);
  pgm.addConstraint("playlist_tracks", "playlist_tracks_playlist_id_fkey", {
    foreignKeys: {
      columns: "playlist_id",
      references: "playlists(id)",
      onDelete: "CASCADE",
    },
  });
};

export const down = (pgm) => {
  pgm.dropConstraint("playlist_tracks", "playlist_tracks_playlist_id_fkey");
};
