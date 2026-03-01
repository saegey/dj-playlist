import { getMeiliClient } from "@/lib/meili";
import { deleteAlbumsFromMeili } from "@/services/albumMeiliService";
import { friendRepository } from "@/services/friendRepository";
import { trackRepository } from "@/services/trackRepository";
import { albumRepository } from "@/services/albumRepository";

type CleanupResult = {
  friendId: number | null;
  deletedTrackIds: string[];
  deletedTracksCount: number;
  deletedAlbumsCount: number;
  deletedFromMeiliTracks: number;
  deletedFromMeiliAlbums: number;
};

function escapeMeiliString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export async function cleanupDiscogsReleases(
  username: string,
  releaseIds: string[]
): Promise<CleanupResult> {
  if (releaseIds.length === 0) {
    return {
      friendId: null,
      deletedTrackIds: [],
      deletedTracksCount: 0,
      deletedAlbumsCount: 0,
      deletedFromMeiliTracks: 0,
      deletedFromMeiliAlbums: 0,
    };
  }

  const friendId = await friendRepository.findIdByUsername(username);
  if (!friendId) {
    return {
      friendId: null,
      deletedTrackIds: [],
      deletedTracksCount: 0,
      deletedAlbumsCount: 0,
      deletedFromMeiliTracks: 0,
      deletedFromMeiliAlbums: 0,
    };
  }

  const deletedTrackIds = await trackRepository.listTrackIdsByFriendAndReleaseIds(
    friendId,
    releaseIds
  );
  const deletedAlbumsCount = await albumRepository.deleteAlbumsByFriendAndReleaseIds(
    friendId,
    releaseIds
  );
  const deletedTracksCount = await trackRepository.deleteTracksByFriendAndReleaseIds(
    friendId,
    releaseIds
  );

  let deletedFromMeiliTracks = 0;
  let deletedFromMeiliAlbums = 0;

  try {
    const meiliClient = getMeiliClient();
    const albumsIndex = meiliClient.index("albums");
    await deleteAlbumsFromMeili(
      albumsIndex,
      releaseIds.map((releaseId) => ({ release_id: releaseId, friend_id: friendId }))
    );
    deletedFromMeiliAlbums = releaseIds.length;
  } catch (error) {
    console.warn("[Discogs Cleanup] Failed to delete albums from Meili:", error);
  }

  try {
    const meiliClient = getMeiliClient();
    const tracksIndex = meiliClient.index("tracks");
    const filter = `(${releaseIds
      .map((id) => `release_id = "${escapeMeiliString(id)}"`)
      .join(" OR ")}) AND friend_id = ${friendId}`;
    await tracksIndex.deleteDocuments({ filter });
    deletedFromMeiliTracks = deletedTrackIds.length;
  } catch (error) {
    console.warn("[Discogs Cleanup] Failed to delete tracks from Meili:", error);
  }

  return {
    friendId,
    deletedTrackIds,
    deletedTracksCount,
    deletedAlbumsCount,
    deletedFromMeiliTracks,
    deletedFromMeiliAlbums,
  };
}
