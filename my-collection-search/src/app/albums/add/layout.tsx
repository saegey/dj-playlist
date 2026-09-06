import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Add Album",
};

export default function AddAlbumLayout({ children }: { children: ReactNode }) {
  return children;
}
