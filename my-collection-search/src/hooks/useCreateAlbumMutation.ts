import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Track } from '@/types/track';

interface AlbumMetadata {
  title: string;
  artist: string;
  year?: string;
  genres?: string[];
  styles?: string[];
  album_notes?: string;
  album_rating?: number;
  purchase_price?: number;
  condition?: string;
  label?: string;
  catalog_number?: string;
  country?: string;
  format?: string;
  library_identifier?: string;
}

interface TrackMetadata {
  title: string;
  artist: string;
  position?: string;
  duration_seconds?: number;
  bpm?: number;
  key?: string;
  notes?: string;
  local_tags?: string;
  star_rating?: number;
  apple_music_url?: string;
  spotify_url?: string;
  youtube_url?: string;
  soundcloud_url?: string;
}

interface CreateAlbumRequest {
  album: AlbumMetadata;
  tracks: TrackMetadata[];
  friend_id: number;
  coverArt?: File | null;
}

export function useCreateAlbumMutation() {
  const qc = useQueryClient();

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
    onSuccess: () => {
      // Invalidate albums and tracks queries to trigger refetch
      qc.invalidateQueries({ queryKey: ['albums'] });
      qc.invalidateQueries({ queryKey: ['tracks'] });
    },
  });
}
