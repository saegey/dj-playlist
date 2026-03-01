import { http } from "@/services/http";

export type TrackPlaylistMembership = {
  id: number;
  name: string;
  position: number;
};

export type TrackAudioMetadataResponse = {
  track_id: string;
  friend_id: number;
  local_audio_url: string;
  audio_file_album_art_url?: string | null;
  has_embedded_cover: boolean;
  embedded_cover?: {
    index: number;
    codec_name?: string;
    width?: number;
    height?: number;
    pix_fmt?: string;
  } | null;
  probe: unknown;
};

export type TrackEssentiaResponse = {
  track_id: string;
  friend_id: number;
  file_path: string;
  data: unknown;
};

export type TrackEmbeddingPreviewResponse = {
  track_id: string;
  friend_id: number;
  isDefaultTemplate: boolean;
  template: string;
  prompt: string;
};

type EmbeddingPreviewType = "identity" | "audio_vibe";

type EmbeddingPreviewResponse = {
  type: EmbeddingPreviewType;
  text: string;
  data: unknown;
};

export type IdentityEmbeddingData = {
  title: string;
  artist: string;
  album: string;
  era: string;
  country: string;
  labels: string[];
  genres: string[];
  styles: string[];
  tags: string[];
};

export type IdentityEmbeddingPreviewResponse = {
  identityText: string;
  identityData: IdentityEmbeddingData;
};

export type AudioVibeEmbeddingData = {
  bpm: string;
  bpmRange: string;
  key: string;
  camelot: string;
  danceability: string;
  energy: string;
  dominantMood: string;
  moodProfile: string;
  vibeDescriptors: string[];
  acoustic?: string;
  vocalPresence?: string;
  percussiveness?: string;
  partyMood?: string;
};

export type AudioVibeEmbeddingPreviewResponse = {
  vibeText: string;
  vibeData: AudioVibeEmbeddingData;
};

export async function fetchTrackPlaylists(
  trackId: string,
  friendId: number
): Promise<TrackPlaylistMembership[]> {
  const data = await http<{ playlists?: TrackPlaylistMembership[] }>(
    `/api/tracks/${encodeURIComponent(trackId)}/playlists?friend_id=${friendId}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  return Array.isArray(data.playlists) ? data.playlists : [];
}

export async function fetchTrackAudioMetadata(
  trackId: string,
  friendId: number
): Promise<TrackAudioMetadataResponse> {
  return await http<TrackAudioMetadataResponse>(
    `/api/tracks/${encodeURIComponent(trackId)}/audio-metadata?friend_id=${friendId}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );
}

export async function extractEmbeddedCover(
  trackId: string,
  friendId: number
): Promise<string> {
  const data = await http<{ audio_file_album_art_url?: string }>(
    `/api/tracks/${encodeURIComponent(trackId)}/audio-metadata`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friend_id: friendId }),
    }
  );

  return String(data.audio_file_album_art_url || "");
}

export async function fetchTrackEssentiaData(
  trackId: string,
  friendId: number
): Promise<TrackEssentiaResponse> {
  return await http<TrackEssentiaResponse>(
    `/api/tracks/${encodeURIComponent(trackId)}/essentia?friend_id=${friendId}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );
}

export async function fetchTrackEmbeddingPreview(
  trackId: string,
  friendId: number
): Promise<TrackEmbeddingPreviewResponse> {
  return await http<TrackEmbeddingPreviewResponse>(
    `/api/tracks/${encodeURIComponent(trackId)}/embedding-preview?friend_id=${friendId}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );
}

export async function fetchIdentityEmbeddingPreview(
  trackId: string,
  friendId: number
): Promise<IdentityEmbeddingPreviewResponse> {
  const preview = await http<EmbeddingPreviewResponse>(
    `/api/embeddings/preview?track_id=${encodeURIComponent(trackId)}&friend_id=${friendId}&type=identity`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  return {
    identityText: preview.text,
    identityData: preview.data as IdentityEmbeddingData,
  };
}

export async function fetchAudioVibeEmbeddingPreview(
  trackId: string,
  friendId: number
): Promise<AudioVibeEmbeddingPreviewResponse> {
  const preview = await http<EmbeddingPreviewResponse>(
    `/api/embeddings/preview?track_id=${encodeURIComponent(trackId)}&friend_id=${friendId}&type=audio_vibe`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  return {
    vibeText: preview.text,
    vibeData: preview.data as AudioVibeEmbeddingData,
  };
}
