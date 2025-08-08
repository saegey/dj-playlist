// app/providers/UsernameProvider.tsx
"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

type UsernameContextValue = {
  username: string;
  setUsername: (u: string) => void;
  clearUsername: () => void;
};

const UsernameContext = createContext<UsernameContextValue | null>(null);

export function UsernameProvider({
  children,
  initialUsername = "",
}: {
  children: React.ReactNode;
  initialUsername?: string;
}) {
  const [username, setUsername] = useState(initialUsername);
  const value = useMemo(
    () => ({
      username,
      setUsername,
      clearUsername: () => setUsername(""),
    }),
    [username]
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