import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Track",
};

export default function TrackDetailLayout({ children }: { children: ReactNode }) {
  return children;
}
