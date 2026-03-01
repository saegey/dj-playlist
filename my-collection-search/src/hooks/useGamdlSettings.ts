import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchGamdlSettings,
  updateGamdlSettings,
  resetGamdlSettings,
  UpdateGamdlSettingsBody,
} from "@/services/internalApi/settings";

type GamdlSettingsUpdate = Omit<UpdateGamdlSettingsBody, "friend_id">;

/**
 * Hook for getting gamdl settings for a specific friend
 */
export function useGamdlSettings(friendId: number) {
  return useQuery({
    queryKey: ["gamdl-settings", friendId],
    queryFn: async () => {
      const response = await fetchGamdlSettings(friendId);
      return response.settings;
    },
    enabled: !!friendId, // Only run query if friendId is provided
  });
}

/**
 * Hook for updating gamdl settings
 */
export function useUpdateGamdlSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ friendId, updates }: { friendId: number; updates: GamdlSettingsUpdate }) =>
      updateGamdlSettings({ friend_id: friendId, ...updates }),
    onSuccess: (data, variables) => {
      // Update the cache with the new settings
      queryClient.setQueryData(["gamdl-settings", variables.friendId], data.settings);
      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["gamdl-settings", variables.friendId] });
    },
    onError: (error) => {
      console.error("Failed to update gamdl settings:", error);
    },
  });
}

/**
 * Hook for resetting gamdl settings to defaults
 */
export function useResetGamdlSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (friendId: number) => resetGamdlSettings({ friend_id: friendId }),
    onSuccess: (data, friendId) => {
      // Update the cache with the reset settings
      queryClient.setQueryData(["gamdl-settings", friendId], data.settings);
      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["gamdl-settings", friendId] });
    },
    onError: (error) => {
      console.error("Failed to reset gamdl settings:", error);
    },
  });
}
