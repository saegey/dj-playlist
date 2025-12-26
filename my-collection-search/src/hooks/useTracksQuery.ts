"use client";
import { useMutation } from "@tanstack/react-query";

import { saveTrack } from "@/services/trackService";
import type { TrackEditFormProps } from "@/components/TrackEditForm";
import { useTrackStore } from "@/stores/trackStore";
import type { Track } from "@/types/track";
import { useTracksCacheUpdater } from "./useTracksCacheUpdater";

// Shape returned by saveTrack is void; customize if API starts returning a Track

export function useTracksQuery() {
  const { updateTrack, getTrack, setTrack } = useTrackStore();
  const { updateTracksInCache } = useTracksCacheUpdater();

  const saveTrackMutation = useMutation({
    mutationFn: async (data: TrackEditFormProps) => {
      return await saveTrack(data);
    },
    // Optimistic update: update Zustand store immediately
    onMutate: async (form: TrackEditFormProps) => {
      const track_id = form.track_id;
      const friend_id = form.friend_id;

      if (!friend_id) return;

      // Get current track from store for rollback
      const currentTrack = getTrack(track_id, friend_id);

      // Build optimistic updates
      const updates: Partial<Track> = {
        title: form.title,
        artist: form.artist,
        album: form.album,
        local_tags: form.local_tags,
        notes: form.notes,
        bpm: form.bpm != null ? String(form.bpm) : undefined,
        key: form.key,
        danceability:
          form.danceability != null ? String(form.danceability) : undefined,
        apple_music_url: form.apple_music_url,
        spotify_url: form.spotify_url,
        youtube_url: form.youtube_url,
        soundcloud_url: form.soundcloud_url,
        star_rating: form.star_rating,
        duration_seconds:
          form.duration_seconds === null ? undefined : form.duration_seconds,
      };

      // Apply optimistic update to Zustand
      updateTrack(track_id, friend_id, updates);

      // Apply optimistic update to React Query caches (search, playlists, albums, recommendations)
      updateTracksInCache({ track_id, friend_id, ...updates });

      console.log("Optimistically updated track", track_id, "with", updates);

      // Return previous state for potential rollback
      return { currentTrack, track_id, friend_id };
    },
    onError: (_err, _form, context) => {
      // Rollback to previous state
      if (context?.currentTrack) {
        setTrack(context.currentTrack);
      }
      // TODO: Also rollback React Query cache updates
    },
    onSuccess: (updatedTrack) => {
      // Apply the server response to the store
      if (updatedTrack?.track_id) {
        setTrack(updatedTrack as Track);
        // Also update React Query caches with server response
        updateTracksInCache(updatedTrack as Track);
      }
    },
  });

  return {
    saveTrack: (data: TrackEditFormProps) =>
      saveTrackMutation.mutateAsync(data),
    saveTrackLoading: saveTrackMutation.isPending,
  };
}
