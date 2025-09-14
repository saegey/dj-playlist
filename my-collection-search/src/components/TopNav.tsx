"use client";
import React from "react";
import { usePathname } from "next/navigation";
import TopMenuBar from "@/components/MenuBar";

// Wraps TopMenuBar and passes the current path automatically.
export default function TopNav() {
  const pathname = usePathname() || "/";

  // Normalize: strip trailing slash except root
  const normalized = pathname !== "/" && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;

  return <TopMenuBar current={normalized} />;
}
