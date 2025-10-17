"use client";

import React from "react";
import { useJobEventsSSE } from "@/hooks/useJobEventsSSE";

export function JobWatcherProvider({ children }: { children: React.ReactNode }) {
  // Watch for job completions via SSE and update all track caches + Zustand store
  useJobEventsSSE();

  return <>{children}</>;
}