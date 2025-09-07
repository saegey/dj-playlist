export function buildTrackMetadataPrompt(args: {
  title?: string;
  artist?: string;
  album?: string;
}): string {
  const title = args.title ?? "";
  const artist = args.artist ?? "";
  const album = args.album ?? "";
  return `Given the following track details, suggest genre, style, and detailed DJ-focused notes.\nTitle: ${title}\nArtist: ${artist}\nAlbum: ${album}`;
}
