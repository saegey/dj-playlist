export const up = (pgm) => {
  pgm.addColumn("albums", {
    audio_file_album_art_url: {
      type: "text",
      notNull: false,
    },
  });
};

export const down = (pgm) => {
  pgm.dropColumn("albums", "audio_file_album_art_url");
};
