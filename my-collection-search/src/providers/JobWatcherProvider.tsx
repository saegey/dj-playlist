"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useJobEventsSSE } from "@/hooks/useJobEventsSSE";

export function JobWatcherProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldWatch =
    pathname === "/jobs" ||
    pathname === "/backfill-audio" ||
    pathname.startsWith("/playlists/");

  // Watch for job completions via SSE and update all track caches + Zustand store
  useJobEventsSSE(shouldWatch);

  return <>{children}</>;
}
