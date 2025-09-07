import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type { InfiniteData as RQInfiniteData } from "@tanstack/react-query";
import type { Track } from "@/types/track";

type PageWithHits = { hits: Track[] };

export type TrackPatch = { track_id: string } & Partial<Track>;

function mergePatchIntoTrack(existing: Track, patch: Partial<Track>): Track {
  // Spread merging is type-safe for Partial<Track>
  return { ...existing, ...patch };
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
    console.log("Updating tracks in cache:", patches);
    if (patches.length === 0) return;

    qc.setQueriesData<PageWithHits | RQInfiniteData<PageWithHits>>(
      { queryKey: queryKeys.tracksRoot(), exact: false },
      (old) => {
        if (!old) return old;

        // Infinite data shape
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

        // Single page
        const o = old as PageWithHits;
        if (Array.isArray(o.hits)) {
          return {
            ...o,
            hits: applyPatchToHits(o.hits ?? [], patches),
          } as PageWithHits;
        }

        return old;
      }
    );
  };

  return { updateTracksInCache };
}
