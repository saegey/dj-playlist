import { getMeiliClient } from "@/lib/meili";
import { friendRepository, type FriendRow } from "@/server/repositories/friendRepository";

type ProgressFn = (line: string) => void;

function escapeMeiliFilterValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export class FriendService {
  async listFriends(): Promise<FriendRow[]> {
    return friendRepository.listFriends();
  }

  async addFriend(username: string): Promise<void> {
    await friendRepository.insertFriendIfMissing(username);
  }

  async removeFriend(username: string, onProgress: ProgressFn): Promise<void> {
    // Remove manifest and release files
    try {
      const {
        getManifestPath,
        getManifestReleaseIds,
        getReleasePath,
        DISCOGS_EXPORTS_DIR,
      } = await import("@/server/services/discogsManifestService");
      const fs = await import("fs");
      const path = await import("path");

      const manifestPath = getManifestPath(username);
      if (fs.existsSync(manifestPath)) {
        fs.unlinkSync(manifestPath);
        onProgress(`Deleted manifest: ${manifestPath}`);
      } else {
        onProgress(`Manifest not found: ${manifestPath}`);
      }

      const releaseIds = getManifestReleaseIds(username);
      for (const releaseId of releaseIds) {
        const releasePath = getReleasePath(username, releaseId);
        if (releasePath && fs.existsSync(releasePath)) {
          fs.unlinkSync(releasePath);
          onProgress(`Deleted release: ${releasePath}`);
        } else if (releasePath) {
          onProgress(`Release not found: ${releasePath}`);
        }
      }

      const files = fs.readdirSync(DISCOGS_EXPORTS_DIR);
      for (const file of files) {
        if (file.startsWith(`${username}_release_`) && file.endsWith(".json")) {
          fs.unlinkSync(path.join(DISCOGS_EXPORTS_DIR, file));
          onProgress(`Deleted legacy release: ${file}`);
        }
      }
    } catch (error) {
      onProgress(
        `Error deleting manifest/release files: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    // Remove from MeiliSearch
    try {
      const meiliClient = getMeiliClient();
      const tracksIndex = meiliClient.index("tracks");
      const escaped = escapeMeiliFilterValue(username);
      await tracksIndex.deleteDocuments({ filter: `username = "${escaped}"` });
      onProgress(`Deleted tracks from MeiliSearch for user: ${username}`);
    } catch (error) {
      onProgress(
        `Error deleting from MeiliSearch: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    // Remove from Postgres
    try {
      await friendRepository.deleteTracksByUsername(username);
      onProgress(`Deleted tracks from Postgres for user: ${username}`);
    } catch (error) {
      onProgress(
        `Error deleting user tracks from Postgres: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    await friendRepository.deleteFriendByUsername(username);
    onProgress(`Deleted friend: ${username}`);
  }
}

export const friendService = new FriendService();
