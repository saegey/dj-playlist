import { TracksFilter } from "@/components/TracksFilterModal";

/**
 * Convert TracksFilter state to MeiliSearch filter strings
 * MeiliSearch filters support IS NULL, IS NOT NULL, AND, OR operators
 */
export function buildMeiliSearchFilters(filters: TracksFilter): string[] {
  const filterStrings: string[] = [];

  // Missing local audio
  if (filters.missingAudio) {
    filterStrings.push("local_audio_url IS NULL");
  }

  // Missing metadata (BPM OR Key)
  if (filters.missingMetadata) {
    filterStrings.push("(bpm IS NULL OR key IS NULL)");
  }

  // Missing ALL streaming URLs
  if (filters.missingAnyStreamingUrl) {
    filterStrings.push(
      "(apple_music_url IS NULL AND youtube_url IS NULL AND spotify_url IS NULL AND soundcloud_url IS NULL)"
    );
  } else {
    // Individual streaming URL filters (only if not using "all" filter)
    if (filters.missingAppleMusic) {
      filterStrings.push("apple_music_url IS NULL");
    }

    if (filters.missingYouTube) {
      filterStrings.push("youtube_url IS NULL");
    }

    if (filters.missingSpotify) {
      filterStrings.push("spotify_url IS NULL");
    }

    if (filters.missingSoundCloud) {
      filterStrings.push("soundcloud_url IS NULL");
    }
  }

  return filterStrings;
}

/**
 * Check if any filters are active
 */
export function hasActiveFilters(filters: TracksFilter): boolean {
  return Object.values(filters).some(Boolean);
}

/**
 * Get count of active filters
 */
export function getActiveFilterCount(filters: TracksFilter): number {
  return Object.values(filters).filter(Boolean).length;
}

/**
 * Create empty filter state
 */
export function createEmptyFilters(): TracksFilter {
  return {
    missingAudio: false,
    missingAppleMusic: false,
    missingYouTube: false,
    missingSpotify: false,
    missingSoundCloud: false,
    missingAnyStreamingUrl: false,
    missingMetadata: false,
  };
}
