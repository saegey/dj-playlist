import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Album } from "@/types/track";
import { CreateAlbumRequest } from "@/types/albumMetadata";
import { useAlbumStore } from "@/stores/albumStore";
import { useTrackStore } from "@/stores/trackStore";
import { createAlbum, type CreateAlbumResponse } from "@/services/internalApi/albums";

export function useCreateAlbumMutation() {
  const qc = useQueryClient();
  const setAlbum = useAlbumStore((state) => state.setAlbum);
  const setTracks = useTrackStore((state) => state.setTracks);

  return useMutation<CreateAlbumResponse, Error, CreateAlbumRequest>({
    mutationFn: async (data: CreateAlbumRequest) => createAlbum(data),
    onSuccess: (data) => {
      if (data?.album) {
        setAlbum(data.album as Album);
      }
      if (Array.isArray(data?.tracks) && data.tracks.length > 0) {
        setTracks(data.tracks);
      }
      // Invalidate albums and tracks queries to trigger refetch
      qc.invalidateQueries({ queryKey: ["albums"] });
      qc.invalidateQueries({ queryKey: ["tracks"] });
    },
  });
}
