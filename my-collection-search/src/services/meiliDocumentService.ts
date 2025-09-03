import { Index } from "meilisearch";
import { DiscogsTrack } from "@/types/track";

export async function addTracksToMeili(index: Index, tracks: DiscogsTrack[]) {
  await index.addDocuments(
    tracks.map((t) => {
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
    })
  );
}
