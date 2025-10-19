/**
 * Get the manifest file path for a given username.
 * For the current user (DISCOGS_USERNAME), returns manifest.json
 * For other users (friends), returns manifest_${username}.json
 */
export function getManifestPath(username: string): string {
  const currentUser = process.env.DISCOGS_USERNAME;
  if (currentUser && username === currentUser) {
    return path.join(DISCOGS_EXPORTS_DIR, "manifest.json");
  }
  return path.join(DISCOGS_EXPORTS_DIR, `manifest_${username}.json`);
}
/**
 * Get all release IDs for a given username from their manifest file.
 * Returns an empty array if the manifest does not exist or is invalid.
 */
export function getManifestReleaseIds(username: string): string[] {
  const manifestPath = getManifestPath(username);
  if (!fs.existsSync(manifestPath)) return [];
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    return Array.isArray(manifest.releaseIds) ? manifest.releaseIds : [];
  } catch {
    return [];
  }
}
import fs from "fs";
import path from "path";
import { DiscogsRelease, DiscogsTrack, ProcessedTrack } from "@/types/track";
import { parseDurationToSeconds } from "@/lib/trackUtils";

export const DISCOGS_EXPORTS_DIR = path.resolve(
  process.cwd(),
  "discogs_exports"
);

export function getManifestFiles(): string[] {
  if (!fs.existsSync(DISCOGS_EXPORTS_DIR)) return [];
  return fs
    .readdirSync(DISCOGS_EXPORTS_DIR)
    .filter((f) => /^manifest(_.*)?\.json$/.test(f));
}

export function createExportsDir() {
  if (!fs.existsSync(DISCOGS_EXPORTS_DIR)) {
    fs.mkdirSync(DISCOGS_EXPORTS_DIR);
  }
}

export function getReleasePath(
  username: string,
  releaseId: string
): string | null {
  let releasePath = path.join(DISCOGS_EXPORTS_DIR, `release_${releaseId}.json`);
  if (
    !fs.existsSync(releasePath) &&
    username &&
    process.env.DISCOGS_USERNAME &&
    username !== process.env.DISCOGS_USERNAME
  ) {
    const alt = path.join(
      DISCOGS_EXPORTS_DIR,
      `${username}_release_${releaseId}.json`
    );
    if (fs.existsSync(alt)) {
      releasePath = alt;
    }
  }
  if (!fs.existsSync(releasePath)) {
    return null;
  }
  return releasePath;
}

export function getReleaseWritePath(
  username: string,
  releaseId: string
): string {
  // For writing new releases, determine the path based on username
  if (username && process.env.DISCOGS_USERNAME && username !== process.env.DISCOGS_USERNAME) {
    return path.join(DISCOGS_EXPORTS_DIR, `${username}_release_${releaseId}.json`);
  } else {
    return path.join(DISCOGS_EXPORTS_DIR, `release_${releaseId}.json`);
  }
}

export function loadAlbum(releasePath: string): DiscogsRelease | null {
  try {
    return JSON.parse(fs.readFileSync(releasePath, "utf-8"));
  } catch {
    return null;
  }
}

export function saveManifest(
  manifestPath: string,
  releaseIds: string[],
  deletedReleaseIds?: string[]
) {
  // Read existing manifest to preserve deletedReleaseIds if not provided
  let existingDeletedIds: string[] = [];
  if (!deletedReleaseIds && fs.existsSync(manifestPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      existingDeletedIds = existing.deletedReleaseIds || [];
    } catch {
      // ignore parse errors
    }
  }

  const manifest = {
    releaseIds: Array.from(new Set(releaseIds)),
    deletedReleaseIds: deletedReleaseIds
      ? Array.from(new Set(deletedReleaseIds))
      : existingDeletedIds,
    lastSynced: new Date().toISOString(),
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

export function deleteRelease(username: string, releaseId: string): boolean {
  const releasePath = getReleasePath(username, releaseId);
  if (releasePath && fs.existsSync(releasePath)) {
    fs.unlinkSync(releasePath);
    return true;
  }
  return false;
}

export function extractTracksFromAlbum(
  album: DiscogsRelease,
  username: string
): DiscogsTrack[] {
  const artist_name =
    album.artists_sort || album.artists?.[0]?.name || "Unknown Artist";
  return album.tracklist.map((tr: ProcessedTrack) => {
    const track_id = `${album.id}-${tr.position}`
      .trim()
      .replace(/[^A-Za-z0-9\-_]/g, "");
    return {
      track_id,
      title: tr.title,
      artist: tr.artists?.map((a) => a.name).join(", ") || artist_name,
      album: album.title,
      year: album.year,
      styles: album.styles || [],
      genres: album.genres || [],
      duration: tr.duration,
      discogs_url: album.uri,
      album_thumbnail: album.thumb,
      position: tr.position,
      duration_seconds:
        typeof tr.duration_seconds === "number"
          ? tr.duration_seconds
          : parseDurationToSeconds(tr.duration),
      bpm: null,
      key: null,
      notes: null,
      local_tags: [],
      apple_music_url: tr.apple_music_url || null,
      local_audio_url: tr.local_audio_url || null,
      username,
    };
  });
}

export function parseManifestFile(manifestFile: string) {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(DISCOGS_EXPORTS_DIR, manifestFile), "utf-8")
  );

  // If manifest has username field, use that
  if (manifest.username) {
    return { manifest, username: manifest.username };
  }

  // For manifest.json (current user), use DISCOGS_USERNAME or extract from filename
  if (manifestFile === "manifest.json") {
    const username = process.env.DISCOGS_USERNAME || "current_user";
    return { manifest, username };
  }

  // For manifest_username.json format, extract username from filename
  const username = manifestFile.replace(/^manifest_|\.json$/g, "");
  return { manifest, username };
}

export function getAllTracksFromManifests(): DiscogsTrack[] {
  const manifestFiles = getManifestFiles();
  const allTracks: DiscogsTrack[] = [];
  for (const manifestFile of manifestFiles) {
    const { manifest, username } = parseManifestFile(manifestFile);
    const releaseIds: string[] = manifest.releaseIds || [];
    for (const releaseId of releaseIds) {
      const releasePath = getReleasePath(username, releaseId);
      if (!releasePath) continue;
      const album = loadAlbum(releasePath);
      if (!album) continue;
      allTracks.push(...extractTracksFromAlbum(album, username));
    }
  }
  return allTracks;
}
