// app/providers/UsernameProvider.tsx
"use client";

import { Friend } from "@/types/track";
import React, { createContext, useContext, useMemo, useState } from "react";

type UsernameContextValue = {
  friend: Friend | null;
  setFriend: (u: Friend | null) => void;
  clearFriend: () => void;
};

const UsernameContext = createContext<UsernameContextValue | null>(null);

export function UsernameProvider({
  children,
  initialFriend = null,
}: {
  children: React.ReactNode;
  initialFriend?: Friend | null;
}) {
  const [friend, setFriend] = useState<Friend | null>(initialFriend);
  const value = useMemo(
    () => ({
      friend,
      setFriend,
      clearFriend: () => setFriend(null),
    }),
    [friend]
  );

  return (
    <UsernameContext.Provider value={value}>
      {children}
    </UsernameContext.Provider>
  );
}

export function useUsername() {
  const ctx = useContext(UsernameContext);
  if (!ctx) {
    throw new Error("useUsername must be used within a UsernameProvider");
  }
  return ctx;
}