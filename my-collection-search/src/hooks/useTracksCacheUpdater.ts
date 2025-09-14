import { useQueryClient } from "@tanstack/react-query";
import type { InfiniteData as RQInfiniteData } from "@tanstack/react-query";
import type { Track } from "@/types/track";

type PageWithHits = { hits: Track[] };

export type TrackPatch = { track_id: string } & Partial<Track>;

function mergePatchIntoTrack(existing: Track, patch: Partial<Track>): Track {
  // Only apply defined properties to avoid wiping values with undefined
  const next: Track = { ...existing } as Track;
  for (const [k, v] of Object.entries(patch) as [keyof Track, unknown][]) {
    if (v !== undefined) {
      // Assign with cast to satisfy index type
      (next as Record<keyof Track, unknown>)[k] = v;
    }
  }
  return next;
}

function applyPatchToHits(hits: Track[], patches: TrackPatch[]): Track[] {
  const byId = new Map(patches.map((p) => [p.track_id, p]));
  if (byId.size === 0) return hits;
  return hits.map((h) => {
    const p = byId.get(h.track_id);
    return p ? mergePatchIntoTrack(h, p) : h;
  });
}

export function useTracksCacheUpdater() {
  const qc = useQueryClient();

  const updateTracksInCache = (patch: TrackPatch | TrackPatch[]) => {
    const patches = Array.isArray(patch) ? patch : [patch];
    // Debug: list keys we're about to touch
    // console.table(
    //   qc
    //     .getQueryCache()
    //     .findAll()
    //     .map((q) => ({ key: JSON.stringify(q.queryKey) }))
    // );

    qc.setQueriesData<PageWithHits | RQInfiniteData<PageWithHits>>(
      {
        // Match only search queries with key shape: ["tracks", { ...args }]
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === "tracks" &&
          q.queryKey.length === 2 &&
          typeof q.queryKey[1] === "object" &&
          q.queryKey[1] !== null &&
          !Array.isArray(q.queryKey[1]),
      },
      (old) => {
        if (!old) return old;

        // Infinite shape
        const maybeInfinite = old as Partial<RQInfiniteData<PageWithHits>>;
        if (Array.isArray(maybeInfinite.pages)) {
          const o = maybeInfinite as RQInfiniteData<PageWithHits>;
          return {
            pageParams: o.pageParams,
            pages: o.pages.map((p) => ({
              ...p,
              hits: applyPatchToHits(p.hits ?? [], patches),
            })),
          } satisfies RQInfiniteData<PageWithHits>;
        }

        // Single page shape
        const o = old as PageWithHits;
        if (Array.isArray(o.hits)) {
          return { ...o, hits: applyPatchToHits(o.hits ?? [], patches) };
        }

        // Unknown shape; keep as-is
        return old;
      }
    );

    // Also update playlist tracks queries that cache Track[] directly
    qc.setQueriesData<Track[] | undefined>(
      {
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "playlist-tracks",
      },
      (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((t) => {
          const p = patches.find((pp) => pp.track_id === t.track_id);
          return p ? mergePatchIntoTrack(t, p) : t;
        });
      }
    );
  };

  return { updateTracksInCache };
}
