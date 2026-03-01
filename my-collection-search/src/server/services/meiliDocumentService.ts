import { Index } from "meilisearch";
import type { DiscogsTrack, Track } from "@/types/track";

const BATCH_SIZE = 1000; // Meilisearch recommends batches of 1000 documents

type MeiliTrackSource = (DiscogsTrack | Track) & {
  embedding?: number[] | string | null;
};

export async function addTracksToMeili(index: Index, tracks: MeiliTrackSource[]) {
  const documents = tracks.map((t) => {
    const { embedding, ...rest } = t;
    return rest;
  });

  // Process in batches to avoid payload size limits
  const tasks = [];
  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE);
    console.log(
      `[Meilisearch] Adding batch ${i / BATCH_SIZE + 1}/${Math.ceil(documents.length / BATCH_SIZE)} (${batch.length} documents)`
    );
    const task = await index.addDocuments(batch);
    tasks.push(task);
  }

  console.log(
    `[Meilisearch] Enqueued ${tasks.length} batches for ${documents.length} total documents`
  );
  return tasks;
}
