export function buildTrackMetadataPrompt(
  args: {
  title?: string;
  artist?: string;
  album?: string;
  },
  basePrompt: string
): string {
  const title = args.title ?? "";
  const artist = args.artist ?? "";
  const album = args.album ?? "";
  const preamble = basePrompt || "";
  return (
    `${preamble}\n` +
    `Return a JSON object with the fields: genre, notes.\n` +
    `Title: ${title}\nArtist: ${artist}\nAlbum: ${album}`
  );
}

export function buildBulkTrackMetadataPrompt(
  tracks: Array<{
    track_id: string;
    title: string;
    artist: string;
    album?: string;
    url?: string | null | undefined;
  }>,
  basePrompt: string
): string {
  const preamble = basePrompt || "";
  const header =
    `${preamble}\n` +
    `For each track below, return a JSON object with the fields: track_id, local_tags (string), notes.\n` +
    `In local_tags, use the genre or style of the actual track (not the album).`;

  const body = tracks
    .map((t) => {
      const lines = [
        `Track ID: ${t.track_id}`,
        `Title: ${t.title}`,
        `Artist: ${t.artist}`,
        `Album: ${t.album ?? ""}`,
        t.url ? `Reference URL: ${t.url}` : undefined,
        `---`,
      ].filter(Boolean);
      return lines.join("\n");
    })
    .join("\n");

  return `${header}\n Tracks:\n${body}`;
}
