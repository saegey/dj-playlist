"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/react-query";

import { saveTrack } from "@/services/trackService";
import type { TrackEditFormProps } from "@/components/TrackEditForm";
import { useTracksCacheUpdater } from "./useTracksCacheUpdater";
import type { Track } from "@/types/track";

// Shape returned by saveTrack is void; customize if API starts returning a Track

export function useTracksQuery() {
  const queryClient = useQueryClient();
  const { updateTracksInCache } = useTracksCacheUpdater();
  const saveTrackMutation = useMutation({
    mutationFn: async (data: TrackEditFormProps) => {
      return await saveTrack(data);
    },
    // Optimistic update: patch all cached "tracks" queries immediately
  onMutate: async (form: TrackEditFormProps) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic state
      await queryClient.cancelQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          (q.queryKey[0] === "tracks" || q.queryKey[0] === "playlist-tracks"),
      });

      // Snapshot previous data for rollback per matching query
      const matching = queryClient.getQueryCache().findAll({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          (q.queryKey[0] === "tracks" || q.queryKey[0] === "playlist-tracks"),
      });
      const snapshots: { key: QueryKey; data: unknown }[] = matching.map((q) => ({
        key: q.queryKey as QueryKey,
        data: queryClient.getQueryData(q.queryKey as QueryKey),
      }));

      // Build a minimal patch. Try to infer track_id and treat the rest as Partial<Track>
      const track_id = form.track_id;
      if (track_id) {
        // Map form fields -> Track shape conservatively
        const patch: Partial<Track> & { track_id: string } = {
          track_id,
          title: form.title ?? undefined,
          artist: form.artist ?? undefined,
          album: form.album ?? undefined,
          local_tags: form.local_tags ?? undefined,
          notes: form.notes ?? undefined,
          bpm: form.bpm != null ? String(form.bpm) : undefined,
          key: form.key ?? undefined,
          danceability: form.danceability != null ? String(form.danceability) : undefined,
          apple_music_url: form.apple_music_url ?? undefined,
          spotify_url: form.spotify_url ?? undefined,
          youtube_url: form.youtube_url ?? undefined,
          soundcloud_url: form.soundcloud_url ?? undefined,
          star_rating: typeof form.star_rating === "number" ? form.star_rating : undefined,
          duration_seconds: form.duration_seconds ?? undefined,
          username: form.username ?? undefined,
        };
        updateTracksInCache(patch);
      }

      // Return context for rollback
      return { snapshots } as {
        snapshots: { key: readonly unknown[]; data: unknown }[];
      };
    },
  onError: (_err, _form, context) => {
      // Roll back cached data to previous snapshots
      if (context?.snapshots) {
        for (const s of context.snapshots) {
      queryClient.setQueryData(s.key, s.data);
        }
      }
    },
    onSuccess: (updatedTrack) => {
      // Merge the authoritative server Track across caches
      if (updatedTrack?.track_id) {
        const { track_id, ...rest } = updatedTrack as Track;
        updateTracksInCache({ track_id, ...rest });
      }
      // Lightly invalidate inactive to reconcile any missed fields
      queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          (q.queryKey[0] === "tracks" || q.queryKey[0] === "playlist-tracks"),
        refetchType: "inactive",
      });
    },
  });

  return {
    saveTrack: (data: TrackEditFormProps) =>
      saveTrackMutation.mutateAsync(data),
    saveTrackLoading: saveTrackMutation.isPending,
  };
}
