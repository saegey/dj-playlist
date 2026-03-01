export interface AlbumMetadata {
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

export interface TrackMetadata {
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

export interface TrackUpsertMetadata extends TrackMetadata {
  track_id?: string;
}

export interface CreateAlbumRequest {
  album: AlbumMetadata;
  tracks: TrackMetadata[];
  friend_id: number;
  coverArt?: File | null;
}

export interface UpdateAlbumWithTracksParams {
  release_id: string;
  album: AlbumMetadata;
  tracks: TrackUpsertMetadata[];
  friend_id: number;
  coverArt?: File | null;
}
