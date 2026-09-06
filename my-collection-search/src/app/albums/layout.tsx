import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Albums",
};

export default function AlbumsLayout({ children }: { children: ReactNode }) {
  return children;
}
