import { NextResponse } from "next/server";
import {
  appearanceSettingsPutBodySchema,
  appearanceSettingsResponseSchema,
} from "@/api-contract/schemas";
import { paletteIds } from "@/app/palettes";
import { settingsService } from "@/server/services/settingsService";

/** The app-wide palette. Light/dark is per device and never reaches the server. */
export async function GET() {
  try {
    const result = await settingsService.getAppearance();
    return NextResponse.json(appearanceSettingsResponseSchema.parse(result));
  } catch (err) {
    console.error("Failed to load appearance settings:", err);
    return NextResponse.json(
      { error: "Failed to load appearance settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = appearanceSettingsPutBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: `palette must be one of: ${paletteIds.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const result = await settingsService.updateAppearance(parsed.data.palette);
    return NextResponse.json(appearanceSettingsResponseSchema.parse(result));
  } catch (err) {
    console.error("Failed to update appearance settings:", err);
    return NextResponse.json(
      { error: "Failed to update appearance settings" },
      { status: 500 }
    );
  }
}
