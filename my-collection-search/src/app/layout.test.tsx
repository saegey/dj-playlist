import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("./providers", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/components/EmotionRegistry", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/components/AppShell", () => ({ default: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock("@/components/ui/toaster", () => ({ Toaster: () => null }));
vi.mock("@/components/AnalyticsInit", () => ({ default: () => null }));
vi.mock("@/lib/analytics/config", () => ({ getClientAnalyticsConfig: () => ({}) }));
vi.mock("@/lib/developerTools", () => ({ developerToolsEnabled: () => false }));

import RootLayout from "./layout";

describe("root layout", () => {
  it("server-renders the default palette on <html>, so there is no flash", () => {
    const html = renderToStaticMarkup(<RootLayout>content</RootLayout>);
    expect(html).toMatch(/^<html [^>]*data-palette="sleeve"/);
    expect(html).toContain("<main>content</main>");
  });

  it("leaves the light/dark class to the colour-mode provider", () => {
    const html = renderToStaticMarkup(<RootLayout>x</RootLayout>);
    expect(html).not.toMatch(/^<html [^>]*class=/);
  });
});
