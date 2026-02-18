export const up = (pgm) => {
  pgm.addColumn("tracks", {
    audio_file_album_art_url: {
      type: "text",
      notNull: false,
    },
  });
};

export const down = (pgm) => {
  pgm.dropColumn("tracks", "audio_file_album_art_url");
};
