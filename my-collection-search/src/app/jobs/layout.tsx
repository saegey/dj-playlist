import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Jobs",
};

export default function JobsLayout({ children }: { children: ReactNode }) {
  return children;
}
