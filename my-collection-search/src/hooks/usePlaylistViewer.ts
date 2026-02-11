import type { Track } from "@/types/track";
import { formatSeconds, getTrackDurationSeconds } from "@/lib/trackUtils";

export function usePlaylistViewer({
  playlist,
  playlistCounts,
  moveTrack,
  setEditTrack,
  removeFromPlaylist,
  playlistAvgEmbedding
}: {
  playlist: Track[];
  playlistCounts: Record<string, number>;
  moveTrack: (fromIdx: number, toIdx: number) => void;
  setEditTrack: (track: Track) => void;
  removeFromPlaylist: (trackId: string) => void;
  playlistAvgEmbedding?: number[];
}) {
  // Compute total playtime
  const totalPlaytimeSeconds = playlist.reduce((sum, track) => {
    return sum + (getTrackDurationSeconds(track) || 0);
  }, 0);

  const totalPlaytimeFormatted = formatSeconds(totalPlaytimeSeconds);

  // Optionally, you could memoize or wrap handlers here

  return {
    playlist,
    playlistCounts,
    moveTrack,
    setEditTrack,
    removeFromPlaylist,
    totalPlaytimeFormatted,
    playlistAvgEmbedding
  };
}
