import { Index } from "meilisearch";
import { DiscogsTrack } from "@/types/track";

const BATCH_SIZE = 1000; // Meilisearch recommends batches of 1000 documents

export async function addTracksToMeili(index: Index, tracks: DiscogsTrack[]) {
  const documents = tracks.map((t) => {
    const { embedding, ...rest } = t as DiscogsTrack & {
      embedding?: number[] | string;
    };
    let vectorArr: number[] | null = null;
    if (Array.isArray(embedding)) vectorArr = embedding;
    else if (typeof embedding === "string") {
      try {
        vectorArr = JSON.parse(embedding);
      } catch {}
    }
    return {
      ...rest,
      _vectors: { default: vectorArr },
      hasVectors: !!vectorArr,
    };
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
