import type { Track } from "@/types/track";
import { parseDurationToSeconds, formatSeconds } from "@/lib/trackUtils";

export function usePlaylistViewer({
  playlist,
  playlistCounts,
  moveTrack,
  setEditTrack,
  removeFromPlaylist,
}: {
  playlist: Track[];
  playlistCounts: Record<string, number>;
  moveTrack: (fromIdx: number, toIdx: number) => void;
  setEditTrack: (track: Track) => void;
  removeFromPlaylist: (trackId: string) => void;
}) {
  // Compute total playtime
  const totalPlaytimeSeconds = playlist.reduce((sum, track) => {
    if (!track.duration) {
      return (
        sum +
        (typeof track.duration_seconds === "number"
          ? track.duration_seconds
          : 0)
      );
    }
    return sum + parseDurationToSeconds(track.duration);
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
  };
}
