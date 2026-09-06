import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Edit Track",
};

export default function EditTrackLayout({ children }: { children: ReactNode }) {
  return children;
}
