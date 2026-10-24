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
import { fontClassName } from "./fonts";
import { defaultPaletteId, type PaletteId } from "./palettes";
import { settingsService } from "@/server/services/settingsService";

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

// The saved palette, or the default when it can't be read: a settings outage
// must not take the whole app down with it.
async function readPalette(): Promise<PaletteId> {
  try {
    return (await settingsService.getAppearance()).palette;
  } catch (err) {
    console.error("Failed to load the saved palette, using the default:", err);
    return defaultPaletteId;
  }
}

// data-palette is server-rendered so the palette is in place before first
// paint. Light/dark is per device (localStorage) and applied client-side.
export default async function RootLayout({ children }: { children: ReactNode }) {
  const palette = await readPalette();
  return (
    <html lang="en" data-palette={palette} className={fontClassName} suppressHydrationWarning>
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
