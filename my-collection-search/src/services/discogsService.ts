import { DiscogsVideo } from "@/services/discogsApiClient";

export interface DiscogsLookupRelease {
  videos?: DiscogsVideo[];
  video?: DiscogsVideo[];
  [key: string]: unknown;
}

export interface DiscogsLookupResult {
  release?: DiscogsLookupRelease | null;
  [key: string]: unknown;
}

/**
 * Lookup Discogs videos for a track by track_id
 * @param trackId - The track ID to lookup
 * @returns DiscogsLookupResult with videos, or null if not found
 */
export async function lookupDiscogsVideos(
  trackId: string
): Promise<DiscogsLookupResult | null> {
  try {
    const res = await fetch(`/api/ai/discogs?track_id=${trackId}`);
    if (!res.ok) {
      throw new Error(`Discogs lookup failed: ${res.status}`);
    }
    const data: DiscogsLookupResult = await res.json();
    return data;
  } catch (error) {
    console.error("Discogs lookup error:", error);
    return null;
  }
}

/**
 * Extract videos array from Discogs lookup result
 * @param result - The Discogs lookup result
 * @returns Array of DiscogsVideo objects, or empty array if none found
 */
export function extractDiscogsVideos(
  result: DiscogsLookupResult | null
): DiscogsVideo[] {
  if (!result?.release) return [];

  const rel = result.release as DiscogsLookupRelease;
  const vids: DiscogsVideo[] = (rel.videos ?? rel.video ?? []) as DiscogsVideo[];

  return vids || [];
}
