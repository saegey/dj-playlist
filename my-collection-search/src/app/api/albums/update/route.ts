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
}

export async function PATCH(request: NextRequest) {
  try {
    const body: AlbumUpdateRequest = await request.json();
    const { release_id, friend_id, album_rating, album_notes, purchase_price, condition } = body;

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
    await pool.end();

    // Update in MeiliSearch
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
    });
  } catch (error) {
    console.error("Error updating album:", error);
    return NextResponse.json(
      {
        error: "Failed to update album",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
