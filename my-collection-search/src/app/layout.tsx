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
import { defaultFontChoiceId } from "./fontChoices";
import { defaultPaletteId } from "./palettes";
import {
  customPaletteCss,
  customPaletteId,
  customPaletteStyleId,
  parseCustomPalette,
  resolveAppearancePalette,
} from "./palettes/custom";
import { settingsService, type Appearance } from "@/server/services/settingsService";

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

const defaultAppearance: Appearance = {
  palette: defaultPaletteId,
  fonts: { display: defaultFontChoiceId, body: defaultFontChoiceId, label: defaultFontChoiceId },
  customPalette: null,
};

// The saved palette and fonts, or the defaults when they can't be read: a
// settings outage must not take the whole app down with it.
async function readAppearance(): Promise<Appearance> {
  try {
    const appearance = await settingsService.getAppearance();
    // Checked again here: only a validated palette may reach the <style>.
    const customPalette = parseCustomPalette(appearance.customPalette);
    return {
      ...appearance,
      customPalette,
      palette: resolveAppearancePalette(appearance.palette, customPalette),
    };
  } catch (err) {
    console.error("Failed to load the saved appearance, using the defaults:", err);
    return defaultAppearance;
  }
}

// The data-* attributes are server-rendered so the palette and fonts are in
// place before first paint. Light/dark is per device (localStorage) and applied
// client-side.
export default async function RootLayout({ children }: { children: ReactNode }) {
  const { palette, fonts, customPalette } = await readAppearance();
  return (
    <html
      lang="en"
      data-palette={palette}
      data-font-display={fonts.display}
      data-font-body={fonts.body}
      data-font-label={fonts.label}
      className={fontClassName}
      suppressHydrationWarning
    >
      {palette === customPaletteId && customPalette ? (
        <head>
          {/* Built only from validated #rrggbb values, so it carries no user text. */}
          <style
            id={customPaletteStyleId}
            dangerouslySetInnerHTML={{ __html: customPaletteCss(customPalette) }}
          />
        </head>
      ) : null}
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
