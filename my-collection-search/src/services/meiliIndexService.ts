import { MeiliSearch, Index } from "meilisearch";

export async function getOrCreateTracksIndex(meiliClient: MeiliSearch): Promise<Index> {
  try {
    return await meiliClient.getIndex("tracks");
  } catch {
    await meiliClient.createIndex("tracks", { primaryKey: "id" });
    return meiliClient.index("tracks");
  }
}

export async function configureMeiliIndex(index: Index, meiliClient: MeiliSearch) {
  // Configure embedders and fail fast if vector settings are rejected.
  const embedderResp = await fetch(
    `${meiliClient.config.host}/indexes/tracks/settings/embedders`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${meiliClient.config.apiKey ?? ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        default: { source: "userProvided", dimensions: 1536 },
      }),
    }
  );
  if (!embedderResp.ok) {
    const details = await embedderResp.text();
    throw new Error(
      `Failed to configure Meili embedders (${embedderResp.status}): ${details}`
    );
  }

  await index.updateSearchableAttributes([
    "local_tags",
    "artist",
    "composer",
    "album",
    "styles",
    "title",
    "notes",
    "genres",
    "library_identifier",
  ]);
  await index.updateFilterableAttributes([
    "track_id",
    "bpm",
    "genres",
    "key",
    "year",
    "composer",
    "local_tags",
    "styles",
    "local_audio_url",
    "apple_music_url",
    "hasVectors",
    "youtube_url",
    "spotify_url",
    "soundcloud_url",
    "friend_id",
    "library_identifier",
  ]);
  await index.updateSortableAttributes([
    "library_identifier",
    "year",
    "bpm",
    "star_rating",
  ]);
  await index.updateRankingRules([
    "words",
    "typo",
    "proximity",
    "attribute",
    "sort",
    "exactness",
  ]);
}
