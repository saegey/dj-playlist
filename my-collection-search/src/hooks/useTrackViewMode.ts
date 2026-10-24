"use client";

import { useCallback, useEffect, useState } from "react";
import { useBreakpointValue } from "@chakra-ui/react";

export type TrackViewMode = "row" | "card";

/** localStorage key shared by every track list that offers Rows/Cards. */
export const TRACK_VIEW_MODE_KEY = "searchViewMode";

/**
 * The Rows/Cards choice for a track list, persisted so it carries over between
 * lists. `viewMode` is the saved choice (what the toggle shows); `layout` is
 * what to render: phones always get cards.
 */
export function useTrackViewMode() {
  const [viewMode, setViewModeState] = useState<TrackViewMode>("row");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(TRACK_VIEW_MODE_KEY);
      if (saved === "row" || saved === "card") setViewModeState(saved);
    } catch {
      // Storage blocked: keep the default.
    }
  }, []);

  const setViewMode = useCallback((mode: TrackViewMode) => {
    setViewModeState(mode);
    try {
      localStorage.setItem(TRACK_VIEW_MODE_KEY, mode);
    } catch {
      // The choice still applies for this visit.
    }
  }, []);

  const isMobile = useBreakpointValue({ base: true, md: false }) ?? true;
  const layout: TrackViewMode = isMobile ? "card" : viewMode;

  return { viewMode, setViewMode, layout, isMobile };
}
