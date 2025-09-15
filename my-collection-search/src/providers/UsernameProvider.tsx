// app/providers/UsernameProvider.tsx
"use client";

import { Friend } from "@/types/track";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

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
  const STORAGE_KEY = "mcs:selectedFriend";
  const [friend, _setFriend] = useState<Friend | null>(initialFriend);

  const persist = useCallback((f: Friend | null) => {
    try {
      if (f) localStorage.setItem(STORAGE_KEY, JSON.stringify(f));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore storage errors (private mode, quota, etc.)
    }
  }, []);

  const setFriend = useCallback(
    (f: Friend | null) => {
      _setFriend(f);
      persist(f);
    },
    [persist]
  );

  const clearFriend = useCallback(() => setFriend(null), [setFriend]);

  // Hydrate from localStorage on mount (unless initialFriend provided)
  useEffect(() => {
    if (initialFriend) {
      _setFriend(initialFriend);
      persist(initialFriend);
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (
          parsed &&
          typeof parsed === "object" &&
          "id" in parsed &&
          "username" in parsed
        ) {
          _setFriend(parsed as Friend);
        }
      }
    } catch {
      // ignore parse errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync across tabs via the storage event
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      try {
        if (e.newValue) {
          const parsed = JSON.parse(e.newValue) as unknown;
          if (
            parsed &&
            typeof parsed === "object" &&
            "id" in parsed &&
            "username" in parsed
          ) {
            _setFriend(parsed as Friend);
          } else {
            _setFriend(null);
          }
        } else {
          _setFriend(null);
        }
      } catch {
        _setFriend(null);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const value = useMemo(
    () => ({
      friend,
      setFriend,
      clearFriend,
    }),
    [friend, setFriend, clearFriend]
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
