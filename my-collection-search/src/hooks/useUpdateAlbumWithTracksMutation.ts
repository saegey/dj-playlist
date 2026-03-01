import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UpdateAlbumWithTracksParams } from "@/types/albumMetadata";
import type { Album, Track } from "@/types/track";
import { useAlbumStore } from "@/stores/albumStore";
import { useTrackStore } from "@/stores/trackStore";

async function updateAlbumWithTracks(params: UpdateAlbumWithTracksParams) {
  const formData = new FormData();

  formData.append('release_id', params.release_id);
  formData.append('album', JSON.stringify(params.album));
  formData.append('tracks', JSON.stringify(params.tracks));
  formData.append('friend_id', params.friend_id.toString());

  if (params.coverArt) {
    formData.append('cover_art', params.coverArt);
  }

  const response = await fetch('/api/albums/upsert', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update album');
  }

  return response.json() as Promise<{ album: Album; tracks: Track[] }>;
}

export function useUpdateAlbumWithTracksMutation() {
  const queryClient = useQueryClient();
  const setAlbum = useAlbumStore((state) => state.setAlbum);
  const setTracks = useTrackStore((state) => state.setTracks);

  return useMutation({
    mutationFn: updateAlbumWithTracks,
    onSuccess: (data, variables) => {
      if (data?.album) {
        setAlbum(data.album);
      }
      if (Array.isArray(data?.tracks) && data.tracks.length > 0) {
        setTracks(data.tracks);
      }

      // Invalidate album detail query
      queryClient.invalidateQueries({
        queryKey: ['album', variables.release_id, variables.friend_id],
      });

      // Invalidate albums list
      queryClient.invalidateQueries({
        queryKey: ['albums'],
      });

      // Invalidate tracks queries if tracks changed
      queryClient.invalidateQueries({
        queryKey: ['tracks'],
      });
    },
  });
}
