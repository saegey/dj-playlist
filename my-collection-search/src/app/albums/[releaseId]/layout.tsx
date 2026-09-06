import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Album",
};

export default function AlbumDetailLayout({ children }: { children: ReactNode }) {
  return children;
}
