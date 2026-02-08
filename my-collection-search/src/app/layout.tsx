// app/layout.tsx
import type { ReactNode } from "react";
import ClientProviders from "./providers"; // <- client wrapper
import AppShell from "@/components/AppShell";
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
          <Toaster />
          <AppShell>{children}</AppShell>
        </ClientProviders>
      </body>
    </html>
  );
}
