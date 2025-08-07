// --- Types and Utilities for Playlist Ordering ---
import type { Track } from "@/types/track";

export type TrackCompat = Track & {
  _vectors?: { default?: number[] };
  energy?: number | string;
  bpm?: number | string;
};

export interface TrackWithCamelot {
  camelot_key?: string;
  _vectors?: {
    default?: number[];
  };
  energy: number;
  bpm: number;
  idx: number; // index in original playlist
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val ** 2, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val ** 2, 0));
  return dot / (normA * normB);
}

export function camelotDistance(a: string, b: string): number {
  if (!a || !b) return 6;
  const parse = (k: string) => {
    const m = k.match(/^\d{1,2}[AB]$/i);
    if (!m) return null;
    return [parseInt(k, 10), k.slice(-1).toUpperCase()];
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

export function transitionPenalty(
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

export function buildCompatibilityGraph(
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

export function greedyPath(tracks: TrackWithCamelot[], edges: number[][]): number[] {
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
