"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

type PlaylistDrawerContextValue = {
  open: () => void;
  close: () => void;
  isOpen: boolean;
  setOpen: (v: boolean) => void;
};

const PlaylistDrawerContext = createContext<PlaylistDrawerContextValue | null>(
  null
);

export function PlaylistDrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo(
    () => ({
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      isOpen,
      setOpen: setIsOpen,
    }),
    [isOpen]
  );

  return (
    <PlaylistDrawerContext.Provider value={value}>
      {children}
    </PlaylistDrawerContext.Provider>
  );
}

export function usePlaylistDrawer() {
  const ctx = useContext(PlaylistDrawerContext);
  if (!ctx) throw new Error("usePlaylistDrawer must be used within PlaylistDrawerProvider");
  return ctx;
}

export default PlaylistDrawerProvider;
