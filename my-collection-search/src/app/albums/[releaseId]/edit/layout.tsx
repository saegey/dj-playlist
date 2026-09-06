import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Edit Album",
};

export default function EditAlbumLayout({ children }: { children: ReactNode }) {
  return children;
}
