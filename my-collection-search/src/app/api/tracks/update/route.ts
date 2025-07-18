import { NextResponse } from "next/server";
import { updateTrack } from "@/lib/db";
import { getMeiliClient } from "@/lib/meili";

export async function PATCH(req: Request) {
  const meiliClient = getMeiliClient({ server: true });

  try {
    const data = await req.json();
    const updated = await updateTrack(data);
    if (!updated) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    // Update MeiliSearch index
    try {
      const index = meiliClient.index("tracks");
      await index.updateDocuments([updated]);
    } catch (meiliError) {
      console.error("Failed to update MeiliSearch:", meiliError);
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating track:", error);
    return NextResponse.json(
      { error: "Failed to update track" },
      { status: 500 }
    );
  }
}
