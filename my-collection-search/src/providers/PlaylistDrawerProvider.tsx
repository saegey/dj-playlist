"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import { PlaylistViewerDrawer } from "@/components/PlaylistViewerDrawer";
import type { MeiliSearch } from "meilisearch";
import type { Track } from "@/types/track";

type PlaylistDrawerContextValue = {
  open: () => void;
  close: () => void;
  isOpen: boolean;
};

const PlaylistDrawerContext = createContext<PlaylistDrawerContextValue | null>(
  null
);

export function PlaylistDrawerProvider({
  children,
  meiliClient,
  handleEditClick,
}: {
  children?: React.ReactNode;
  meiliClient: MeiliSearch | null;
  hasMounted: boolean;
  handleEditClick: (t: Track) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo(
    () => ({
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      isOpen,
    }),
    [isOpen]
  );

  return (
    <PlaylistDrawerContext.Provider value={value}>
      {children}
      <PlaylistViewerDrawer
        handleEditClick={handleEditClick}
        meiliClient={meiliClient}
      />
    </PlaylistDrawerContext.Provider>
  );
}

export function usePlaylistDrawer() {
  const ctx = useContext(PlaylistDrawerContext);
  if (!ctx)
    throw new Error(
      "usePlaylistDrawer must be used within PlaylistDrawerProvider"
    );
  return ctx;
}

export default PlaylistDrawerProvider;
