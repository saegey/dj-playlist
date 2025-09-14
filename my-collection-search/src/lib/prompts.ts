function commonMetadataPreamble(): string {
  return (
    "You are a DJ music metadata assistant. For each track, suggest concise, accurate genre/style tags and write DJ-focused notes. " +
    "In notes, include vibe, energy, suggested set placement, transition tips, and any emotional or cultural context. " +
    "Do not repeat the track name; refer to it as 'This track'."
  );
}

export function buildTrackMetadataPrompt(args: {
  title?: string;
  artist?: string;
  album?: string;
}): string {
  const title = args.title ?? "";
  const artist = args.artist ?? "";
  const album = args.album ?? "";
  const preamble = commonMetadataPreamble();
  return (
    `${preamble}\n` +
    `Return a JSON object with the fields: genre, notes.\n` +
    `Title: ${title}\nArtist: ${artist}\nAlbum: ${album}`
  );
}

export function buildBulkTrackMetadataPrompt(tracks: Array<{
  track_id: string;
  title: string;
  artist: string;
  album?: string;
  url?: string | null | undefined;
}>): string {
  const preamble = commonMetadataPreamble();
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
        t.url ? `Discogs/Spotify URL: ${t.url}` : undefined,
        `---`,
      ].filter(Boolean);
      return lines.join("\n");
    })
    .join("\n");

  return `${header}\n Tracks:\n${body}`;
}
