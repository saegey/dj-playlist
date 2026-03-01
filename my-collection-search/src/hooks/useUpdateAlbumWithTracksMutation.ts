import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UpdateAlbumWithTracksParams } from "@/types/albumMetadata";

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

  return response.json();
}

export function useUpdateAlbumWithTracksMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAlbumWithTracks,
    onSuccess: (data, variables) => {
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
