import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InfiniteData as RQInfiniteData } from "@tanstack/react-query";
import type { BackfillTrack } from "@/components/backfill/types";
import type { Track } from "@/types/track";

type TrackStatus = BackfillTrack["status"];

export type TrackStatusUpdate = {
  track_id: string;
  status?: TrackStatus;
  errorMsg?: string | null;
};

type PageWithHits = { hits: (Track | BackfillTrack)[] };

function applyUpdatesToHits(
  hits: (Track | BackfillTrack)[],
  updates: TrackStatusUpdate[]
) {
  const map = new Map(updates.map((u) => [u.track_id, u]));
  return hits.map((h) => {
    const u = map.get(h.track_id);
    if (!u) return h;
    return {
      ...h,
      ...(u.status !== undefined ? { status: u.status } : {}),
      ...(u.errorMsg !== undefined ? { errorMsg: u.errorMsg ?? undefined } : {}),
    } as BackfillTrack;
  });
}

export function useBackfillStatusMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["tracks", "status"],
    mutationFn: async (updates: TrackStatusUpdate | TrackStatusUpdate[]) => {
      // No server call; this is purely optimistic UI update
      return Array.isArray(updates) ? updates : [updates];
    },
    onMutate: async (updates) => {
      const arr = Array.isArray(updates) ? updates : [updates];

      // Update all cached "tracks" queries (both infinite and single-page)
      qc.setQueriesData<PageWithHits | RQInfiniteData<PageWithHits>>(
        { queryKey: ["tracks"], exact: false },
        (old) => {
          if (!old) return old;

          // Infinite shape: { pageParams, pages: [{ hits, ... }] }
          const maybeInfinite = old as Partial<RQInfiniteData<PageWithHits>>;
          if (Array.isArray(maybeInfinite.pages)) {
            const o = maybeInfinite as RQInfiniteData<PageWithHits>;
            const next: RQInfiniteData<PageWithHits> = {
              pageParams: o.pageParams,
              pages: o.pages.map((p) => ({
                ...p,
                hits: applyUpdatesToHits(p.hits ?? [], arr),
              })),
            };
            return next;
          }

          // Single page shape: { hits, ... }
          const o = old as PageWithHits;
          if (Array.isArray(o.hits)) {
            return {
              ...o,
              hits: applyUpdatesToHits(o.hits ?? [], arr),
            };
          }

          return old;
        }
      );
    },
  });
}
