import { useMutation, useQueryClient } from "@tanstack/react-query";

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
  track_id?: string; // Optional - if present, update; if absent, create new
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

interface UpdateAlbumWithTracksParams {
  release_id: string;
  album: AlbumMetadata;
  tracks: TrackMetadata[];
  friend_id: number;
  coverArt?: File | null;
}

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
