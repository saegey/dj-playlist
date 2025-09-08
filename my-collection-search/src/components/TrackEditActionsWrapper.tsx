"use client";

import React from "react";
import TrackEditActions, { TrackEditActionsProps } from "@/components/TrackEditActions";

export type TrackEditActionsInjectedProps = Omit<
  TrackEditActionsProps,
  "analyzeDisabled"
>;

/**
 * Factory that returns a wrapper component for TrackEditActions
 * which only accepts the `analyzeDisabled` prop at call-site.
 */
export function createTrackEditActionsWrapper(
  injected: TrackEditActionsInjectedProps
) {
  return function TrackEditActionsWrapper({
    analyzeDisabled,
  }: {
    analyzeDisabled: boolean;
  }) {
    return (
      <TrackEditActions
        {...injected}
        analyzeDisabled={analyzeDisabled}
      />
    );
  };
}
