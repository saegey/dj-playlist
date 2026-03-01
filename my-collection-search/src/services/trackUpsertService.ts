import { friendRepository } from "@/services/friendRepository";
import { trackRepository } from "@/services/trackRepository";
import type { DiscogsTrack, Track } from "@/types/track";

export async function upsertTracks(tracks: DiscogsTrack[]): Promise<Track[]> {
  const usernames = Array.from(
    new Set(tracks.map((t) => t.username).filter((u): u is string => !!u))
  );

  if (usernames.length > 0) {
    await friendRepository.insertFriendsIfMissing(usernames);
  }

  const friendMap = new Map<string, number>();
  if (usernames.length > 0) {
    const friends = await friendRepository.listByUsernames(usernames);
    for (const friend of friends) {
      friendMap.set(friend.username, friend.id);
    }
  }

  const upserted: Track[] = [];

  for (const track of tracks) {
    let friendId = friendMap.get(track.username);

    if (!friendId) {
      await friendRepository.insertFriendIfMissing(track.username);
      const resolvedId = await friendRepository.findIdByUsername(track.username);
      if (resolvedId) {
        friendId = resolvedId;
        friendMap.set(track.username, resolvedId);
      }
    }

    if (!friendId) {
      console.warn(
        `[Discogs Index] Could not resolve friend_id for username='${track.username}'. Skipping ${track.track_id}`
      );
      continue;
    }

    try {
      const row = await trackRepository.upsertDiscogsTrackByTrackIdUsername(
        track,
        friendId
      );
      upserted.push(row);
    } catch (error) {
      console.warn(
        `[Discogs Index] Failed to upsert ${track.track_id}@${track.username}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  return upserted;
}
