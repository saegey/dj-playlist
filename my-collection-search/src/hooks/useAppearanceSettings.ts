"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { resolvePaletteId, type PaletteId } from "@/app/palettes";
import { queryKeys } from "@/lib/queryKeys";
import {
  fetchAppearanceSettings,
  updateAppearanceSettings,
} from "@/services/internalApi/settings";

/** Point the page at a palette now; the server-rendered attribute only matters on load. */
export function applyPalette(palette: PaletteId) {
  document.documentElement.dataset.palette = palette;
}

export function useAppearanceSettingsQuery() {
  return useQuery({
    queryKey: queryKeys.appearance(),
    queryFn: fetchAppearanceSettings,
    staleTime: 5 * 60 * 1000,
  });
}

/** Saves the palette. It applies at once and goes back if the save fails. */
export function useUpdateAppearanceSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (palette: PaletteId) => updateAppearanceSettings({ palette }),
    onMutate: (palette) => {
      const previous = resolvePaletteId(document.documentElement.dataset.palette);
      applyPalette(palette);
      return { previous };
    },
    // onMutate ran first, so the snapshot is always there.
    onError: (_err, _palette, context) => {
      applyPalette((context as { previous: PaletteId }).previous);
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKeys.appearance(), saved);
    },
  });
}
