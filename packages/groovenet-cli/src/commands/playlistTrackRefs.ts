import { readFileSync } from "node:fs";

export interface PlaylistTrackRef {
  track_id: string;
  friend_id: number;
}

/**
 * Parse a track-refs file: one `track_id` or `track_id,friend_id` per line, in
 * playlist order. Blank lines and `#` comments are skipped. Every line is
 * checked before anything is returned, so one error lists all the bad lines.
 */
export function parseTrackRefs(text: string, defaultFriendId?: number): PlaylistTrackRef[] {
  const refs: PlaylistTrackRef[] = [];
  const errors: string[] = [];
  text.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim();
    if (!line || line.startsWith("#")) return;
    const lineNo = index + 1;
    const parts = line.split(",").map((part) => part.trim());
    const [trackId, friend, ...extra] = parts;
    if (!trackId) {
      errors.push(`line ${lineNo}: missing track_id`);
    } else if (extra.length > 0) {
      errors.push(`line ${lineNo}: expected "track_id" or "track_id,friend_id", got "${line}"`);
    } else if (friend === undefined) {
      if (!Number.isInteger(defaultFriendId) || (defaultFriendId as number) < 1) {
        errors.push(`line ${lineNo}: no friend_id and no default_friend_id configured`);
      } else {
        refs.push({ track_id: trackId, friend_id: defaultFriendId as number });
      }
    } else if (!/^[1-9]\d*$/.test(friend)) {
      errors.push(`line ${lineNo}: friend_id must be a positive integer, got "${friend}"`);
    } else {
      refs.push({ track_id: trackId, friend_id: Number(friend) });
    }
  });
  if (errors.length > 0) throw new Error(`Invalid tracks file:\n${errors.join("\n")}`);
  if (refs.length === 0) throw new Error("Tracks file contains no track refs.");
  return refs;
}

/** Read the refs source: a path, or `-` for stdin. */
export function readTracksSource(source: string): string {
  return readFileSync(source === "-" ? 0 : source, "utf8");
}
