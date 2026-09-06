import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Enrich",
};

export default function EnrichLayout({ children }: { children: ReactNode }) {
  return children;
}
