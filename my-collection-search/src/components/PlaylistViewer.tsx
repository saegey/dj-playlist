// // For compatibility logic, extend Track with possible runtime fields
// type TrackCompat = Track & {
//   _vectors?: { default?: number[] };

import React from "react";
import { Box, Button, Menu, EmptyState, VStack } from "@chakra-ui/react";
import { FiHeadphones, FiMoreVertical } from "react-icons/fi";
import TrackResult from "@/components/TrackResult";
import type { Track } from "@/types/track";
import { usePlaylists } from "@/hooks/usePlaylists";

// --- Types and Utilities ---
type TrackCompat = Track & {
  _vectors?: { default?: number[] };
  energy?: number | string;
  bpm?: number | string;
};

interface TrackWithCamelot {
  camelot_key?: string;
  _vectors?: {
    default?: number[];
  };
  energy: number;
  bpm: number;
  idx: number; // index in original playlist
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val ** 2, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val ** 2, 0));
  return dot / (normA * normB);
}

function camelotDistance(a: string, b: string): number {
  if (!a || !b) return 6;
  const parse = (k: string) => {
    const m = k.match(/^(\d{1,2})([AB])$/i);
    if (!m) return null;
    return [parseInt(m[1], 10), m[2].toUpperCase()];
  };
  const pa = parse(a) as [number, string] | null;
  const pb = parse(b) as [number, string] | null;
  if (!pa || !pb) return 6;
  const [numA, modeA] = pa;
  const [numB, modeB] = pb;
  if (modeA === modeB) {
    return Math.min(Math.abs(numA - numB), 12 - Math.abs(numA - numB));
  }
  return numA === numB ? 1 : 2;
}

function transitionPenalty(
  from: TrackWithCamelot,
  to: TrackWithCamelot
): number {
  const bpmDiff = Math.abs((from.bpm ?? 0) - (to.bpm ?? 0));
  const energyJump = Math.abs((from.energy ?? 0) - (to.energy ?? 0));
  const harmonicPenalty = camelotDistance(
    from.camelot_key ?? "",
    to.camelot_key ?? ""
  );
  return 0.1 * bpmDiff + 1.5 * energyJump + 2.0 * harmonicPenalty;
}

function buildCompatibilityGraph(
  tracks: TrackWithCamelot[],
  alpha = 0.7
): number[][] {
  const n = tracks.length;
  const edges: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; ++i) {
    for (let j = 0; j < n; ++j) {
      if (i === j) continue;
      let sim = 0;
      const vecA = tracks[i]._vectors?.default ?? [];
      const vecB = tracks[j]._vectors?.default ?? [];
      if (vecA.length && vecB.length) {
        sim = cosineSimilarity(vecA, vecB);
      }
      const penalty = transitionPenalty(tracks[i], tracks[j]);
      edges[i][j] = alpha * sim + (1 - alpha) * -penalty;
    }
  }
  return edges;
}

function greedyPath(tracks: TrackWithCamelot[], edges: number[][]): number[] {
  const n = tracks.length;
  if (n === 0) return [];
  const visited = Array(n).fill(false);
  const path = [0];
  visited[0] = true;
  for (let step = 1; step < n; ++step) {
    const last = path[path.length - 1];
    let best = -Infinity;
    let bestIdx = -1;
    for (let j = 0; j < n; ++j) {
      if (!visited[j] && edges[last][j] > best) {
        best = edges[last][j];
        bestIdx = j;
      }
    }
    if (bestIdx === -1) break;
    path.push(bestIdx);
    visited[bestIdx] = true;
  }
  return path;
}

export function keyToCamelot(key: string | undefined | null): string {
  if (!key) return "-";
  const map: Record<string, string> = {
    "C major": "8B",
    "G major": "9B",
    "D major": "10B",
    "A major": "11B",
    "E major": "12B",
    "B major": "1B",
    "F# major": "2B",
    "C# major": "3B",
    "F major": "7B",
    "Bb major": "6B",
    "Eb major": "5B",
    "Ab major": "4B",
    "Db major": "3B",
    "Gb major": "2B",
    "Cb major": "1B",
    "A minor": "8A",
    "E minor": "9A",
    "B minor": "10A",
    "F# minor": "11A",
    "C# minor": "12A",
    "G# minor": "1A",
    "D# minor": "2A",
    "A# minor": "3A",
    "D minor": "7A",
    "G minor": "6A",
    "C minor": "5A",
    "F minor": "4A",
    "Bb minor": "3A",
    "Eb minor": "2A",
    "Ab minor": "1A",
  };
  const k = key.trim().replace(/\s+/g, " ");
  if (map[k]) return map[k];
  const found = Object.entries(map).find(
    ([std]) => std.toLowerCase() === k.toLowerCase()
  );
  if (found) return found[1];
  const m = k.match(/^([A-G][b#]?)(?:\s+)?(major|minor)$/i);
  if (m) {
    const norm = `${m[1].toUpperCase()} ${m[2].toLowerCase()}`;
    if (map[norm]) return map[norm];
  }
  return key;
}

type OptimalOrderType = "original" | "greedy" | "genetic";
interface PlaylistViewerProps {
  playlist: Track[];
  playlistCounts: Record<string, number>;
  moveTrack: (fromIdx: number, toIdx: number) => void;
  setEditTrack: (track: Track) => void;
  removeFromPlaylist: (trackId: string) => void;
  optimalOrderType?: OptimalOrderType;
}

const PlaylistViewer: React.FC<PlaylistViewerProps> = ({
  playlist,
  playlistCounts,
  moveTrack,
  setEditTrack,
  removeFromPlaylist,
  optimalOrderType = "original",
}) => {
  const [geneticPlaylist, setGeneticPlaylist] = React.useState<Track[] | null>(
    null
  );
  const [loadingGenetic, setLoadingGenetic] = React.useState(false);
  const { displayPlaylist, setDisplayPlaylist } = usePlaylists();

  // Compute greedy order
  const updatedPlaylist: TrackWithCamelot[] = React.useMemo(() => {
    if (!playlist) return [];
    return playlist.map((track, idx) => {
      const t = track as TrackCompat;
      return {
        camelot_key: keyToCamelot(t.key),
        _vectors: t._vectors,
        energy: typeof t.energy === "number" ? t.energy : Number(t.energy) || 0,
        bpm: typeof t.bpm === "number" ? t.bpm : Number(t.bpm) || 0,
        idx,
      };
    });
  }, [playlist]);

  const compatibilityEdges = React.useMemo(
    () => buildCompatibilityGraph(updatedPlaylist),
    [updatedPlaylist]
  );
  const optimalPath = React.useMemo(
    () => greedyPath(updatedPlaylist, compatibilityEdges),
    [updatedPlaylist, compatibilityEdges]
  );

  // Fetch genetic order if needed
  React.useEffect(() => {
    if (optimalOrderType !== "genetic" || playlist.length === 0) return;
    setLoadingGenetic(true);
    fetch("/api/playlists/genetic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playlist }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setGeneticPlaylist(data);
      })
      .finally(() => setLoadingGenetic(false));
  }, [optimalOrderType, playlist]);

  React.useEffect(() => {
    if (optimalOrderType === "greedy" && playlist.length > 0) {
      const greedyPlaylist = optimalPath.map(
        (orderIdx) => playlist[updatedPlaylist[orderIdx].idx]
      );
      setDisplayPlaylist(greedyPlaylist);
    } else if (
      optimalOrderType === "genetic" &&
      geneticPlaylist &&
      geneticPlaylist.length > 0
    ) {
      setDisplayPlaylist(geneticPlaylist);
    } else {
      setDisplayPlaylist(playlist);
    }
  }, [
    optimalOrderType,
    playlist,
    optimalPath,
    updatedPlaylist,
    geneticPlaylist,
    setDisplayPlaylist,
  ]);

  if (playlist.length === 0) {
    return (
      <Box overflowY="auto">
        <EmptyState.Root size={"sm"}>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <FiHeadphones />
            </EmptyState.Indicator>
            <VStack textAlign="center">
              <EmptyState.Title>Your playlist is empty</EmptyState.Title>
              <EmptyState.Description>
                Add tracks to your playlist to get started.
              </EmptyState.Description>
            </VStack>
          </EmptyState.Content>
        </EmptyState.Root>
      </Box>
    );
  }

  if (optimalOrderType === "genetic" && loadingGenetic) {
    return <Box p={4}>Loading genetic order...</Box>;
  }

  const ds = displayPlaylist.length > 0 ? displayPlaylist : playlist;

  return (
    <Box overflowY="auto">
      {ds.map((track, idx) => (
        <TrackResult
          key={track.track_id}
          track={track}
          minimized
          playlistCount={playlistCounts[track.track_id]}
          buttons={[
            <Menu.Root key="menu">
              <Menu.Trigger asChild>
                <Button variant="plain" size="xs">
                  <FiMoreVertical size={16} />
                </Button>
              </Menu.Trigger>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item
                    onSelect={() => moveTrack(idx, idx - 1)}
                    value="up"
                    disabled={idx === 0}
                  >
                    Move Up
                  </Menu.Item>
                  <Menu.Item
                    onSelect={() => moveTrack(idx, idx + 1)}
                    value="down"
                    disabled={idx === displayPlaylist.length - 1}
                  >
                    Move Down
                  </Menu.Item>
                  <Menu.Item onSelect={() => setEditTrack(track)} value="edit">
                    Edit
                  </Menu.Item>
                  <Menu.Item
                    onSelect={() => removeFromPlaylist(track.track_id)}
                    value="remove"
                  >
                    Remove
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Menu.Root>,
          ]}
        />
      ))}
    </Box>
  );
};

export default PlaylistViewer;
