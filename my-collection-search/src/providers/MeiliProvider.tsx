// app/providers/MeiliProvider.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MeiliSearch } from "meilisearch";

type MeiliCtx = {
  client: MeiliSearch | null;
  host: string | null;
  token: string | null;
  ready: boolean;
  refresh: () => Promise<void>;
};

const Ctx = createContext<MeiliCtx>({
  client: null,
  host: null,
  token: null,
  ready: false,
  refresh: async () => {},
});

export function MeiliProvider({ children }: { children: React.ReactNode }) {
  const [host, setHost] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [exp, setExp] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const timerRef = useRef<number | null>(null);

  const refresh = async () => {
    const res = await fetch("/api/meili-token", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch Meili token");
    const { host: h, token: t, exp: e } = await res.json();
    console.log("Meili token refreshed", { host: h, token: t, exp: e });
    setHost(h);
    setToken(t);
    setExp(e);
  };

  // fetch at mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refresh().catch(console.error);
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  // schedule proactive refresh ~30s before expiry
  useEffect(() => {
    if (!exp) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    const msUntilExp = exp * 1000 - Date.now();
    const refreshIn = Math.max(5_000, msUntilExp - 30_000); // refresh 30s early
    timerRef.current = window.setTimeout(() => {
      refresh().catch(console.error);
    }, refreshIn);
  }, [exp]);

  // Build a Meili client bound to the current host/token
  const client = useMemo(() => {
    if (!host || !token) return null;
    return new MeiliSearch({ host, apiKey: token });
  }, [host, token]);

  const value = useMemo(
    () => ({ client, host, token, ready, refresh }),
    [client, host, token, ready]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useMeili = () => useContext(Ctx);
