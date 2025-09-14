import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type { Track } from "@/types/track";
import { useTrackStore } from "@/stores/trackStore";
import { exportPlaylistToPDF } from "@/lib/exportPlaylistPdf";

/**
 * Hook for playlist export and utility actions
 * Works with query-based playlist data
 */
export function usePlaylistActions(playlistId?: number) {
  const queryClient = useQueryClient();
  const { getTrack } = useTrackStore();

  // Get tracks from track store
  const getTracks = (): Track[] => {
    if (!playlistId) return [];

    const tracksPlaylist =
      (queryClient.getQueryData(queryKeys.playlistTrackIds(playlistId)) as {
        track_id: string;
        friend_id: number;
      }[]) || [];
    if (tracksPlaylist.length === 0) return [];

    const tracks = tracksPlaylist
      .map((t) => {
        return getTrack(t.track_id, t.friend_id);
      })
      .filter(Boolean) as Track[];

    return tracks;
  };

  // Calculate total playtime
  const getTotalPlaytime = (): { seconds: number; formatted: string } => {
    const tracks = getTracks();
    const totalSeconds = tracks.reduce((sum, track) => {
      return sum + (track.duration_seconds || 0);
    }, 0);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let formatted = "";
    if (hours > 0) {
      formatted = `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    } else {
      formatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }

    return { seconds: totalSeconds, formatted };
  };

  // Export playlist as JSON
  const exportPlaylist = () => {
    console.log("Exporting playlist as JSON");
    const tracks = getTracks();
    console.log(`Playlist has ${tracks.length} tracks`);
    if (tracks.length === 0) return;

    const playlistData = {
      tracks,
      exportDate: new Date().toISOString(),
      totalTracks: tracks.length,
      ...getTotalPlaytime(),
    };

    const blob = new Blob([JSON.stringify(playlistData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `playlist-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export playlist as PDF
  const exportToPDF = (filename?: string) => {
    const tracks = getTracks();
    const { formatted: totalPlaytimeFormatted } = getTotalPlaytime();

    exportPlaylistToPDF({
      playlist: tracks,
      totalPlaytimeFormatted,
      filename:
        filename || `playlist-${new Date().toISOString().split("T")[0]}.pdf`,
    });
  };

  return {
    getTracks,
    getTotalPlaytime,
    exportPlaylist,
    exportToPDF,
  };
}
