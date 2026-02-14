import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const inputTracks = Array.isArray(data?.playlist) ? data.playlist : [];
    const invalid: Array<{ track_id?: string; reason: string }> = [];

    const normalizedTracks = inputTracks
      .map((track: Record<string, unknown>) => {
        const bpmRaw = track.bpm;
        const bpm =
          typeof bpmRaw === "number"
            ? bpmRaw
            : typeof bpmRaw === "string"
            ? Number.parseFloat(bpmRaw)
            : NaN;

        const embeddingRaw =
          track.embedding ??
          (track as { _vectors?: { default?: unknown } })._vectors?.default;
        const embedding =
          Array.isArray(embeddingRaw) && embeddingRaw.length > 0
            ? JSON.stringify(embeddingRaw)
            : typeof embeddingRaw === "string"
            ? embeddingRaw
            : null;

        const trackId =
          typeof track.track_id === "string" ? track.track_id : undefined;

        if (!embedding) {
          invalid.push({ track_id: trackId, reason: "missing_embedding" });
          return null;
        }
        if (!Number.isFinite(bpm)) {
          invalid.push({ track_id: trackId, reason: "missing_bpm" });
          return null;
        }

        return {
          ...track,
          bpm,
          embedding,
        };
      })
      .filter(Boolean);

    if (invalid.length > 0) {
      return NextResponse.json(
        {
          error: "Some tracks are missing required data (embedding or bpm).",
          invalid,
          invalid_count: invalid.length,
        },
        { status: 400 }
      );
    }

    if (normalizedTracks.length === 0) {
      return NextResponse.json(
        { error: "No valid tracks provided for genetic optimization." },
        { status: 400 }
      );
    }
    const res = await fetch(`http://ga-service:8002/optimize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tracks: normalizedTracks,
      }),
    });
    const responseJson = await res.json();
    return NextResponse.json(responseJson, { status: res.status });
  } catch (error) {
    console.error("Error creating playlist:", error);
    return NextResponse.json(
      { error: "Failed to create playlist" },
      { status: 500 }
    );
  }
}
