import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Album, Track } from '@/types/track';
import { CreateAlbumRequest } from '@/types/albumMetadata';
import { useAlbumStore } from "@/stores/albumStore";
import { useTrackStore } from "@/stores/trackStore";

export function useCreateAlbumMutation() {
  const qc = useQueryClient();
  const setAlbum = useAlbumStore((state) => state.setAlbum);
  const setTracks = useTrackStore((state) => state.setTracks);

  return useMutation({
    mutationFn: async (data: CreateAlbumRequest) => {
      const formData = new FormData();
      formData.append('album', JSON.stringify(data.album));
      formData.append('tracks', JSON.stringify(data.tracks));
      formData.append('friend_id', data.friend_id.toString());
      if (data.coverArt) {
        formData.append('cover_art', data.coverArt);
      }

      const res = await fetch('/api/albums/create', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create album');
      }

      return res.json() as Promise<{ album: Record<string, unknown>; tracks: Track[] }>;
    },
    onSuccess: (data) => {
      if (data?.album) {
        setAlbum(data.album as unknown as Album);
      }
      if (Array.isArray(data?.tracks) && data.tracks.length > 0) {
        setTracks(data.tracks);
      }
      // Invalidate albums and tracks queries to trigger refetch
      qc.invalidateQueries({ queryKey: ['albums'] });
      qc.invalidateQueries({ queryKey: ['tracks'] });
    },
  });
}
