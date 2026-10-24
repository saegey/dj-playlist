// app/layout.tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import ClientProviders from "./providers"; // <- client wrapper
import EmotionRegistry from "@/components/EmotionRegistry";
import AppShell from "@/components/AppShell";
import { Toaster } from "@/components/ui/toaster";
import { developerToolsEnabled } from "@/lib/developerTools";
import AnalyticsInit from "@/components/AnalyticsInit";
import { getClientAnalyticsConfig } from "@/lib/analytics/config";
import { defaultPaletteId } from "./palettes";

export const dynamic = "force-dynamic";

// Default document title + template so individual pages can extend it.
export const metadata: Metadata = {
  title: {
    default: "GrooveNet",
    template: "%s · GrooveNet",
  },
  description: "Browse, search, and manage your DJ track collection.",
  appleWebApp: {
    capable: true,
    title: "GrooveNet",
    statusBarStyle: "default",
  },
  icons: {
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

// Let Next.js inject viewport meta into <head>
export const viewport = {
  width: "device-width",
  initialScale: 1,
};

// data-palette is server-rendered so the palette is in place before first
// paint; #669 will read the user's choice instead of the default.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-palette={defaultPaletteId} suppressHydrationWarning>
      <body>
        <AnalyticsInit config={getClientAnalyticsConfig()} />
        <EmotionRegistry>
          <ClientProviders>
            <Toaster />
            <AppShell developerToolsEnabled={developerToolsEnabled()}>{children}</AppShell>
          </ClientProviders>
        </EmotionRegistry>
      </body>
    </html>
  );
}
