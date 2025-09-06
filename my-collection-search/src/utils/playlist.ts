import type { Track } from "@/types/track";

export type WithUserId = { track_id: string; username?: string };

export function idKey<T extends WithUserId>(t: T): string {
  return `${t.username ?? ""}:${t.track_id}`;
}

export function reconcileDisplayPlaylist<T extends WithUserId>(
  playlist: T[],
  display: T[]
): T[] {
  if (playlist.length === 0 && display.length === 0) return display;
  const displayKeys = new Set(display.map((t) => idKey(t)));
  const playlistKeys = new Set(playlist.map((t) => idKey(t)));
  const byKey = new Map(playlist.map((t) => [idKey(t), t] as const));

  const hasExtraneous = display.some((t) => !playlistKeys.has(idKey(t)));
  const hasMissing = playlist.some((t) => !displayKeys.has(idKey(t)));
  if (!hasExtraneous && !hasMissing) return display;

  return [
    // keep items that still exist, mapping to the latest object
    ...display
      .filter((t) => byKey.has(idKey(t)))
      .map((t) => byKey.get(idKey(t))!) ,
    // append new items from playlist not yet shown
    ...playlist.filter((t) => !displayKeys.has(idKey(t))),
  ];
}

export function moveTrackReorder<T>(arr: T[], fromIdx: number, toIdx: number): T[] {
  if (toIdx < 0 || toIdx >= arr.length || fromIdx === toIdx) return arr;
  const updated = [...arr];
  const [removed] = updated.splice(fromIdx, 1);
  updated.splice(toIdx, 0, removed);
  return updated;
}

export type TrackWithEmbedding = Track & {
  _vectors?: { default: number[] };
};

export function computeAverageEmbedding(list: TrackWithEmbedding[]): number[] | null {
  const embeddings = list
    .map((t) => t._vectors?.default)
    .filter((emb): emb is number[] => Array.isArray(emb) && emb.length > 0);
  if (embeddings.length === 0) return null;
  const dim = embeddings[0].length;
  const avg = new Array(dim).fill(0);
  for (const emb of embeddings) {
    for (let i = 0; i < dim; i++) avg[i] += emb[i];
  }
  for (let i = 0; i < dim; i++) avg[i] /= embeddings.length;
  return avg;
}
