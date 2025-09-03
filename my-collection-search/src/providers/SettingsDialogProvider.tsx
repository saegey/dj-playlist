"use client";
import { createContext, useContext, useState, ReactNode } from "react";

type DialogsContextType = {
  discogsSyncOpen: boolean;
  setDiscogsSyncOpen: (v: boolean) => void;
  removeFriendOpen: boolean;
  setRemoveFriendOpen: (v: boolean) => void;
  spotifySyncOpen: boolean;
  setSpotifySyncOpen: (v: boolean) => void;
};

const DialogsContext = createContext<DialogsContextType | null>(null);

export function SettingsDialogsProvider({ children }: { children: ReactNode }) {
  const [discogsSyncOpen, setDiscogsSyncOpen] = useState(false);
  const [removeFriendOpen, setRemoveFriendOpen] = useState(false);
  const [spotifySyncOpen, setSpotifySyncOpen] = useState(false);

  return (
    <DialogsContext.Provider value={{
      discogsSyncOpen, setDiscogsSyncOpen,
      removeFriendOpen, setRemoveFriendOpen,
      spotifySyncOpen, setSpotifySyncOpen,
    }}>
      {children}
    </DialogsContext.Provider>
  );
}

export function useSettingsDialogs() {
  const ctx = useContext(DialogsContext);
  if (!ctx) throw new Error("useSettingsDialogs must be used within SettingsDialogsProvider");
  return ctx;
}