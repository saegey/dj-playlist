export function moveTrackReorder<T>(arr: T[], fromIdx: number, toIdx: number): T[] {
  if (toIdx < 0 || toIdx >= arr.length || fromIdx === toIdx) return arr;
  const updated = [...arr];
  const [removed] = updated.splice(fromIdx, 1);
  updated.splice(toIdx, 0, removed);
  return updated;
}
