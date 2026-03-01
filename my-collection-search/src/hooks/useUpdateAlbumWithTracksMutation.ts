import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAlbumStore } from "@/stores/albumStore";
import { useTrackStore } from "@/stores/trackStore";
import { upsertAlbumWithTracks } from "@/services/internalApi/albums";

export function useUpdateAlbumWithTracksMutation() {
  const queryClient = useQueryClient();
  const setAlbum = useAlbumStore((state) => state.setAlbum);
  const setTracks = useTrackStore((state) => state.setTracks);

  return useMutation({
    mutationFn: upsertAlbumWithTracks,
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
