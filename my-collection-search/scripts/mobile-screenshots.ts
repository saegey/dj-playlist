import { chromium, devices } from "@playwright/test";
import path from "path";
import fs from "fs";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const OUT_DIR = path.join(process.cwd(), "mobile-screenshots");

// iPhone 16 Pro: 393x852 logical pixels
const DEVICE = {
  ...devices["iPhone 15 Pro"],
  viewport: { width: 393, height: 852 },
  deviceScaleFactor: 3,
};

const ROUTES: { name: string; path: string }[] = [
  { name: "home", path: "/" },
  { name: "albums", path: "/albums" },
  { name: "album-detail", path: "/albums/24882152?friend_id=6" },
  { name: "track-detail", path: "/tracks/24882152-B6?friend_id=6" },
  { name: "playlists", path: "/playlists" },
  { name: "playlist-detail", path: "/playlists/162" },
  { name: "spins", path: "/spins?friend_id=6" },
  { name: "settings", path: "/settings" },
  { name: "enrich", path: "/enrich" },
];

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext(DEVICE);
  const page = await context.newPage();

  for (const route of ROUTES) {
    console.log(`Capturing ${route.name} (${route.path})...`);
    try {
      await page.goto(`${BASE_URL}${route.path}`, {
        waitUntil: "load",
        timeout: 15000,
      });
      // Let any animations settle
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(OUT_DIR, `${route.name}.png`),
        fullPage: true,
      });
    } catch (err) {
      console.warn(`  ⚠ Failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  await browser.close();
  console.log(`\nScreenshots saved to: ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
