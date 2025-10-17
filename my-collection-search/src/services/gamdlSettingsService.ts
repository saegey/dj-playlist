import { GamdlSettings, GamdlSettingsUpdate } from "@/types/gamdl";

const API_BASE = "/api/settings/gamdl";

export interface GamdlSettingsResponse {
  settings: GamdlSettings;
}

export interface UpdateGamdlSettingsResponse {
  success: boolean;
  settings: GamdlSettings;
  message: string;
}

/**
 * Get gamdl settings for a specific friend
 */
export async function getGamdlSettings(friendId: number): Promise<GamdlSettings> {
  const response = await fetch(`${API_BASE}?friend_id=${friendId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || error.error || "Failed to get gamdl settings");
  }

  const data: GamdlSettingsResponse = await response.json();
  return data.settings;
}

/**
 * Update gamdl settings for a specific friend
 */
export async function updateGamdlSettings(
  friendId: number,
  updates: GamdlSettingsUpdate
): Promise<GamdlSettings> {
  const response = await fetch(API_BASE, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      friend_id: friendId,
      ...updates,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || error.error || "Failed to update gamdl settings");
  }

  const data: UpdateGamdlSettingsResponse = await response.json();
  return data.settings;
}

/**
 * Reset gamdl settings to defaults for a specific friend
 */
export async function resetGamdlSettings(friendId: number): Promise<GamdlSettings> {
  const response = await fetch(`${API_BASE}/reset`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ friend_id: friendId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || error.error || "Failed to reset gamdl settings");
  }

  const data: UpdateGamdlSettingsResponse = await response.json();
  return data.settings;
}