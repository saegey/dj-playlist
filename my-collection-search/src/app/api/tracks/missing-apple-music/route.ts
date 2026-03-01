import { NextResponse } from "next/server";
import { trackRepository } from "@/services/trackRepository";

export async function GET(request: Request) {
  try {
    // Parse pagination and username params from URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "50", 10);
    const offset = (page - 1) * pageSize;
    const friendId = searchParams.get("friendId");

    const { tracks: rows, total } =
      await trackRepository.findMissingMusicUrlTracksPaginated({
        pageSize,
        offset,
        friendId,
      });

    return NextResponse.json({
      tracks: rows,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Error fetching tracks missing Apple Music URL:", error);
    return NextResponse.json(
      { error: "Failed to fetch tracks" },
      { status: 500 }
    );
  }
}
