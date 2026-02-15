import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import { execFile } from "child_process";

const execFileAsync = promisify(execFile);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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

type TrackRow = {
  track_id: string;
  friend_id: number;
  local_audio_url: string | null;
  audio_file_album_art_url: string | null;
};

async function fetchTrack(trackId: string, friendId: number): Promise<TrackRow | null> {
  const { rows } = await pool.query<TrackRow>(
    `
    SELECT track_id, friend_id, local_audio_url, audio_file_album_art_url
    FROM tracks
    WHERE track_id = $1 AND friend_id = $2
    LIMIT 1
    `,
    [trackId, friendId]
  );
  return rows[0] ?? null;
}

async function runFfprobe(filePath: string): Promise<any> {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "quiet",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    filePath,
  ]);
  return JSON.parse(stdout);
}

function getAttachedPicStream(probe: any): any | null {
  const streams = Array.isArray(probe?.streams) ? probe.streams : [];
  return (
    streams.find(
      (s: any) =>
        s?.disposition?.attached_pic === 1 ||
        (s?.codec_type === "video" && s?.disposition?.default === 0)
    ) ?? null
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const trackId = (await params).id;
    const friendIdRaw = request.nextUrl.searchParams.get("friend_id");
    const friendId = Number(friendIdRaw);
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

    const probe = await runFfprobe(audioPath);
    const attachedPic = getAttachedPicStream(probe);

    return NextResponse.json({
      track_id: track.track_id,
      friend_id: track.friend_id,
      local_audio_url: track.local_audio_url,
      audio_file_album_art_url: track.audio_file_album_art_url,
      has_embedded_cover: !!attachedPic,
      embedded_cover: attachedPic
        ? {
            index: attachedPic.index,
            codec_name: attachedPic.codec_name,
            width: attachedPic.width,
            height: attachedPic.height,
            pix_fmt: attachedPic.pix_fmt,
          }
        : null,
      probe,
    });
  } catch (error) {
    console.error("Error reading audio metadata:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
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

    const probe = await runFfprobe(audioPath);
    const attachedPic = getAttachedPicStream(probe);
    if (!attachedPic) {
      return NextResponse.json(
        { error: "No embedded cover art found in audio file" },
        { status: 404 }
      );
    }

    const outputDir = path.join(process.cwd(), "public", "uploads", "album-covers");
    fs.mkdirSync(outputDir, { recursive: true });
    const safeTrackId = trackId.replace(/[^a-zA-Z0-9._-]/g, "_");
    const outputFile = `${safeTrackId}_${friendId}.jpg`;
    const outputPath = path.join(outputDir, outputFile);

    await execFileAsync("ffmpeg", [
      "-y",
      "-i",
      audioPath,
      "-map",
      `0:${attachedPic.index}`,
      "-frames:v",
      "1",
      outputPath,
    ]);

    const publicUrl = `/uploads/album-covers/${outputFile}`;
    await pool.query(
      `
      UPDATE tracks
      SET audio_file_album_art_url = $1
      WHERE track_id = $2 AND friend_id = $3
      `,
      [publicUrl, trackId, friendId]
    );

    // Keep MeiliSearch in sync so search/card views pick up new art immediately.
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
      console.warn("Failed to update MeiliSearch track artwork field:", meiliErr);
    }

    return NextResponse.json({
      success: true,
      audio_file_album_art_url: publicUrl,
      message: "Extracted embedded cover and saved to track.",
    });
  } catch (error) {
    console.error("Error extracting embedded audio cover:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
