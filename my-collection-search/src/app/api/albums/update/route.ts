// API endpoint for updating album metadata (rating, notes, purchase_price, condition)
import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { getMeiliClient } from "@/lib/meili";

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

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Build dynamic SET clause based on provided fields
    const updates: string[] = [];
    const values = [release_id, friend_id];
    let paramIndex = 3;

    if (album_rating !== undefined) {
      updates.push(`album_rating = $${paramIndex}`);
      values.push(album_rating);
      paramIndex++;
    }

    if (album_notes !== undefined) {
      updates.push(`album_notes = $${paramIndex}`);
      values.push(album_notes);
      paramIndex++;
    }

    if (purchase_price !== undefined) {
      updates.push(`purchase_price = $${paramIndex}`);
      values.push(purchase_price);
      paramIndex++;
    }

    if (condition !== undefined) {
      updates.push(`condition = $${paramIndex}`);
      values.push(condition);
      paramIndex++;
    }

    if (library_identifier !== undefined) {
      // Validate length (max 50 chars as per schema)
      if (library_identifier !== null && library_identifier.length > 50) {
        return NextResponse.json(
          { error: "library_identifier must be 50 characters or less" },
          { status: 400 }
        );
      }
      updates.push(`library_identifier = $${paramIndex}`);
      values.push(library_identifier);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // Always update updated_at
    updates.push("updated_at = current_timestamp");

    const query = `
      UPDATE albums
      SET ${updates.join(", ")}
      WHERE release_id = $1 AND friend_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      await pool.end();
      return NextResponse.json(
        { error: "Album not found" },
        { status: 404 }
      );
    }

    const updatedAlbum = result.rows[0];

    // If library_identifier was updated, fetch all tracks for this album and update them in MeiliSearch
    let updatedTracksCount = 0;
    if (library_identifier !== undefined) {
      try {
        // Fetch all tracks for this album with the new library_identifier from JOIN
        const tracksResult = await pool.query(
          `SELECT t.*, a.library_identifier
           FROM tracks t
           LEFT JOIN albums a ON t.release_id = a.release_id AND t.friend_id = a.friend_id
           WHERE t.release_id = $1 AND t.friend_id = $2`,
          [release_id, friend_id]
        );

        if (tracksResult.rows.length > 0) {
          const meiliClient = getMeiliClient();
          const tracksIndex = meiliClient.index("tracks");

          // Update all tracks in MeiliSearch with the new library_identifier
          await tracksIndex.updateDocuments(tracksResult.rows);
          updatedTracksCount = tracksResult.rows.length;
        }
      } catch (tracksError) {
        console.error("Error updating tracks in MeiliSearch:", tracksError);
        // Don't fail the request if tracks update fails
      }
    }

    await pool.end();

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
