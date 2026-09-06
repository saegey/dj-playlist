import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Spins",
};

export default function SpinsLayout({ children }: { children: ReactNode }) {
  return children;
}
