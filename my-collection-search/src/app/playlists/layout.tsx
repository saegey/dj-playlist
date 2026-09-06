import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Playlists",
};

export default function PlaylistsLayout({ children }: { children: ReactNode }) {
  return children;
}
