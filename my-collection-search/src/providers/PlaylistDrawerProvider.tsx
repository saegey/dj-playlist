"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import { Drawer, Portal } from "@chakra-ui/react";
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
  hasMounted,
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
      <Drawer.Root open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content>
              <PlaylistViewerDrawer
                hasMounted={hasMounted}
                handleEditClick={handleEditClick}
                meiliClient={meiliClient}
              />
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    </PlaylistDrawerContext.Provider>
  );
}

export function usePlaylistDrawer() {
  const ctx = useContext(PlaylistDrawerContext);
  if (!ctx) throw new Error("usePlaylistDrawer must be used within PlaylistDrawerProvider");
  return ctx;
}

export default PlaylistDrawerProvider;
