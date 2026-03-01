// API endpoint for updating album metadata (rating, notes, purchase_price, condition)
import { NextRequest, NextResponse } from "next/server";
import { getMeiliClient } from "@/lib/meili";
import { withDbTransaction } from "@/lib/serverDb";
import { albumRepository } from "@/services/albumRepository";

interface AlbumUpdateRequest {
  release_id: string;
  friend_id: number;
  album_rating?: number;
  album_notes?: string;
  purchase_price?: number;
  condition?: string;
  library_identifier?: string | null;
}

export async function PATCH(request: NextRequest) {
  try {
    const body: AlbumUpdateRequest = await request.json();
    const { release_id, friend_id, album_rating, album_notes, purchase_price, condition, library_identifier } = body;

    if (!release_id || !friend_id) {
      return NextResponse.json(
        { error: "release_id and friend_id are required" },
        { status: 400 }
      );
    }

    if (
      album_rating === undefined &&
      album_notes === undefined &&
      purchase_price === undefined &&
      condition === undefined &&
      library_identifier === undefined
    ) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }
    if (library_identifier !== undefined) {
      // Validate length (max 50 chars as per schema)
      if (library_identifier !== null && library_identifier.length > 50) {
        return NextResponse.json(
          { error: "library_identifier must be 50 characters or less" },
          { status: 400 }
        );
      }
    }

    const updatedAlbum = await withDbTransaction(async (client) => {
      return albumRepository.updateAlbumFields(client, {
        release_id,
        friend_id,
        album_rating,
        album_notes,
        purchase_price,
        condition,
        library_identifier,
      });
    });

    if (!updatedAlbum) {
      return NextResponse.json(
        { error: "Album not found" },
        { status: 404 }
      );
    }

    // If library_identifier was updated, fetch all tracks for this album and update them in MeiliSearch
    let updatedTracksCount = 0;
    if (library_identifier !== undefined) {
      try {
        // Fetch all tracks for this album with the new library_identifier from JOIN
        const tracksResult = await albumRepository.getTracksForAlbumWithLibraryIdentifier(
          release_id,
          friend_id
        );

        if (tracksResult.length > 0) {
          const meiliClient = getMeiliClient();
          const tracksIndex = meiliClient.index("tracks");

          // Update all tracks in MeiliSearch with the new library_identifier
          await tracksIndex.updateDocuments(tracksResult);
          updatedTracksCount = tracksResult.length;
        }
      } catch (tracksError) {
        console.error("Error updating tracks in MeiliSearch:", tracksError);
        // Don't fail the request if tracks update fails
      }
    }

    // Update album in MeiliSearch
    try {
      const meiliClient = getMeiliClient();
      const index = meiliClient.index("albums");

      await index.updateDocuments([
        {
          id: `${updatedAlbum.release_id}_${updatedAlbum.friend_id}`,
          ...updatedAlbum,
        },
      ]);
    } catch (meiliError) {
      console.error("Error updating MeiliSearch:", meiliError);
      // Don't fail the request if MeiliSearch update fails
    }

    return NextResponse.json({
      success: true,
      album: updatedAlbum,
      tracksUpdated: updatedTracksCount,
    });
  } catch (error) {
    console.error("Error updating album:", error);

    // Check for unique constraint violation (duplicate library_identifier)
    if (error instanceof Error && error.message.includes("idx_albums_unique_friend_library_identifier")) {
      return NextResponse.json(
        {
          error: "Duplicate library identifier",
          message: "This library identifier is already in use for another album in your collection.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to update album",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
