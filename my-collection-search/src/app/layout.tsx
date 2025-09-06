// app/layout.tsx
import type { ReactNode } from "react";
import ClientProviders from "./providers"; // <- client wrapper
import TopNav from "@/components/TopNav";
import { Toaster } from "@/components/ui/toaster";

// Let Next.js inject viewport meta into <head>
export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ClientProviders>
          <TopNav />
          <Toaster />
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
