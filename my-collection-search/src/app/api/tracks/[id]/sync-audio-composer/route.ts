import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import { execFile } from "child_process";

const execFileAsync = promisify(execFile);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

type TrackRow = {
  track_id: string;
  friend_id: number;
  local_audio_url: string | null;
  composer: string | null;
};

function normalizeAudioFilename(raw: string): string {
  let value = raw.trim();
  try {
    value = decodeURIComponent(value);
  } catch {
    // ignore malformed encoding and use raw value
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const parsed = new URL(value);
      const nested = parsed.searchParams.get("filename");
      if (nested) value = nested;
      else value = path.basename(parsed.pathname);
    } catch {
      // keep original
    }
  }

  value = value.replace(/^\/+/, "");
  value = value.replace(/^app\/audio\//, "");
  value = value.replace(/^audio\//, "");
  return value;
}

function resolveAudioFilePath(filename: string): string | null {
  const audioDir = process.env.AUDIO_DIR || "/app/audio";
  const normalized = normalizeAudioFilename(filename);
  if (!normalized) return null;

  const root = path.resolve(audioDir);
  const primary = path.resolve(audioDir, normalized);
  if (
    primary.startsWith(root) &&
    fs.existsSync(primary) &&
    fs.statSync(primary).isFile()
  ) {
    return primary;
  }

  const base = path.basename(normalized);
  const fallback = path.resolve(audioDir, base);
  if (
    fallback.startsWith(root) &&
    fs.existsSync(fallback) &&
    fs.statSync(fallback).isFile()
  ) {
    return fallback;
  }

  return null;
}

async function fetchTrack(trackId: string, friendId: number): Promise<TrackRow | null> {
  const { rows } = await pool.query<TrackRow>(
    `
    SELECT track_id, friend_id, local_audio_url, composer
    FROM tracks
    WHERE track_id = $1 AND friend_id = $2
    LIMIT 1
    `,
    [trackId, friendId]
  );
  return rows[0] ?? null;
}

function extractComposerFromProbe(probe: unknown): string | null {
  const tags = (
    probe &&
    typeof probe === "object" &&
    "format" in probe &&
    probe.format &&
    typeof probe.format === "object" &&
    "tags" in probe.format &&
    probe.format.tags &&
    typeof probe.format.tags === "object"
  )
    ? (probe.format.tags as Record<string, unknown>)
    : null;

  if (!tags) return null;

  // Check common composer tag names
  const composerKeys = [
    "composer",
    "COMPOSER",
    "Composer",
    "TPE2",  // ID3 tag for band/orchestra/accompaniment
    "TCOM",  // ID3 tag for composer
  ];

  for (const key of composerKeys) {
    const value = tags[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const trackId = (await params).id;
    const body = await request.json().catch(() => ({}));
    const friendId = Number(body?.friend_id);

    if (!trackId || !friendId || Number.isNaN(friendId)) {
      return NextResponse.json(
        { error: "Missing required parameters: track_id and friend_id" },
        { status: 400 }
      );
    }

    const track = await fetchTrack(trackId, friendId);
    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }
    if (!track.local_audio_url) {
      return NextResponse.json(
        { error: "Track has no local_audio_url" },
        { status: 404 }
      );
    }

    const audioPath = resolveAudioFilePath(track.local_audio_url);
    if (!audioPath) {
      return NextResponse.json(
        { error: "Local audio file not found" },
        { status: 404 }
      );
    }

    const { stdout } = await execFileAsync("ffprobe", [
      "-v",
      "quiet",
      "-print_format",
      "json",
      "-show_entries",
      "format_tags",
      audioPath,
    ]);
    const probe = JSON.parse(stdout);
    const composer = extractComposerFromProbe(probe);

    if (!composer) {
      return NextResponse.json(
        { error: "No composer tag found in audio metadata" },
        { status: 404 }
      );
    }

    await pool.query(
      `
      UPDATE tracks
      SET composer = $1
      WHERE track_id = $2 AND friend_id = $3
      `,
      [composer, trackId, friendId]
    );

    // Update MeiliSearch
    try {
      const { rows } = await pool.query(
        `
        SELECT
          t.*,
          COALESCE(a.library_identifier, t.library_identifier) AS library_identifier
        FROM tracks t
        LEFT JOIN albums a
          ON t.release_id = a.release_id AND t.friend_id = a.friend_id
        WHERE t.track_id = $1 AND t.friend_id = $2
        LIMIT 1
        `,
        [trackId, friendId]
      );
      const updatedTrack = rows[0];
      if (updatedTrack) {
        const { getMeiliClient } = await import("@/lib/meili");
        const meiliClient = getMeiliClient();
        const index = meiliClient.index("tracks");
        await index.updateDocuments([updatedTrack]);
      }
    } catch (meiliErr) {
      console.warn("Failed to update MeiliSearch track composer field:", meiliErr);
    }

    return NextResponse.json({
      success: true,
      composer,
      previous_composer: track.composer ?? null,
      message: "Synced track composer from audio metadata",
    });
  } catch (error) {
    console.error("Error syncing track composer from audio metadata:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
