// app/layout.tsx
import type { ReactNode } from "react";
import ClientProviders from "./providers"; // <- client wrapper
import EmotionRegistry from "@/components/EmotionRegistry";
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
        <EmotionRegistry>
          <ClientProviders>
            <Toaster />
            <AppShell>{children}</AppShell>
          </ClientProviders>
        </EmotionRegistry>
      </body>
    </html>
  );
}
