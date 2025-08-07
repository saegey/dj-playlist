import jsPDF from "jspdf";
import type { Track } from "@/types/track";
import { formatSeconds } from "@/lib/trackUtils";

/**
 * Exports a playlist to PDF using jsPDF.
 * @param playlist The playlist array (all tracks)
 * @param displayPlaylist The display playlist (may be reordered or filtered)
 * @param totalPlaytimeFormatted The formatted total playtime string
 * @param filename The filename for the PDF (default: "playlist.pdf")
 */
export function exportPlaylistToPDF({
  playlist,
  displayPlaylist,
  totalPlaytimeFormatted,
  filename = "playlist.pdf",
}: {
  playlist: Track[];
  displayPlaylist: Track[];
  totalPlaytimeFormatted: string;
  filename?: string;
}) {
  if (!playlist.length) return;
  const currentPlaylist = displayPlaylist.length > 0 ? displayPlaylist : playlist;
  const doc = new jsPDF();
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.text(`Total Tracks: ${playlist.length}`, 10, 15);
  doc.text(`Total Playtime: ${totalPlaytimeFormatted}`, 10, 18);
  let y = 25;
  doc.setFontSize(8);
  doc.setLineHeightFactor(0.8);

  currentPlaylist.forEach((track, idx) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    const indexStr = idx + 1 < 10 ? ` ${idx + 1}` : `${idx + 1}`;
    doc.text(
      `${indexStr}. ${track.artist || "Unknown Artist"} - ${
        track.title || "Untitled"
      }`,
      10,
      y
    );
    y += 3;
    if (track.album) {
      doc.text(`   Album: ${track.album}`, 12, y);
      y += 3;
    }
    if (track.bpm || track.key) {
      doc.text(
        `   BPM: ${track.bpm || "-"}   Key: ${track.key || "-"}`,
        12,
        y
      );
      y += 3;
    }
    // if (track.danceability) {
    //   doc.text(`   Danceability: ${track.danceability}`, 12, y);
    //   y += 5;
    // }
    if (track.duration_seconds) {
      doc.text(
        `   Duration: ${formatSeconds(track.duration_seconds)} / Position: ${
          track.position
        }`,
        12,
        y
      );
      y += 3;
    }
    if (track.local_tags) {
      // Remove problematic characters (newlines, tabs, excessive spaces, non-printable, and non-ASCII)
      const cleanTags = String(track.local_tags)
        .replace(/[^\x20-\x7E]+/g, " ") // keep only printable ASCII
        .replace(/\s+/g, " ") // collapse all whitespace
        .trim();
      doc.text(`   Tags: ${cleanTags}`, 12, y);
      y += 3;
    }
    y += 2;
  });
  doc.save(filename);
}
