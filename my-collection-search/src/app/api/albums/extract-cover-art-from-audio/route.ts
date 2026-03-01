import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { albumRepository } from "@/services/albumRepository";

const execFileAsync = promisify(execFile);

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

async function runFfprobe(filePath: string): Promise<unknown> {
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

function getAttachedPicStream(probe: unknown): { index?: number; disposition?: { attached_pic?: number; default?: number }; codec_type?: string } | null {
  const streams =
    probe &&
    typeof probe === "object" &&
    "streams" in probe &&
    Array.isArray((probe as { streams?: unknown }).streams)
      ? ((probe as { streams: unknown[] }).streams as Array<{
          index?: number;
          disposition?: { attached_pic?: number; default?: number };
          codec_type?: string;
        }>)
      : [];
  return (
    streams.find(
      (s) =>
        s?.disposition?.attached_pic === 1 ||
        (s?.codec_type === "video" && s?.disposition?.default === 0)
    ) ?? null
  );
}

function safePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const friendId = Number(body?.friend_id);
    const releaseIdRaw = body?.release_id;
    const releaseId = String(releaseIdRaw || "").trim();

    if (!friendId || Number.isNaN(friendId) || !releaseId) {
      return NextResponse.json(
        { error: "Missing required parameters: friend_id and release_id" },
        { status: 400 }
      );
    }

    const rows = await albumRepository.getTracksForReleaseWithAudio(
      friendId,
      releaseId
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No tracks with local audio found for this album" },
        { status: 404 }
      );
    }

    let sourceTrackId: string | null = null;
    let sourceAudioPath: string | null = null;
    let streamIndex: number | null = null;

    for (const row of rows) {
      if (!row.local_audio_url) continue;
      const audioPath = resolveAudioFilePath(row.local_audio_url);
      if (!audioPath) continue;
      const probe = await runFfprobe(audioPath);
      const attachedPic = getAttachedPicStream(probe);
      if (!attachedPic?.index && attachedPic?.index !== 0) continue;
      sourceTrackId = row.track_id;
      sourceAudioPath = audioPath;
      streamIndex = Number(attachedPic.index);
      break;
    }

    if (!sourceTrackId || !sourceAudioPath || streamIndex === null) {
      return NextResponse.json(
        { error: "No embedded cover art found on any local track in this album" },
        { status: 404 }
      );
    }

    const outputDir = path.join(process.cwd(), "public", "uploads", "album-covers");
    fs.mkdirSync(outputDir, { recursive: true });
    const outputFile = `${safePart(releaseId)}_${friendId}.jpg`;
    const outputPath = path.join(outputDir, outputFile);

    await execFileAsync("ffmpeg", [
      "-y",
      "-i",
      sourceAudioPath,
      "-map",
      `0:${streamIndex}`,
      "-frames:v",
      "1",
      outputPath,
    ]);

    const publicUrl = `/uploads/album-covers/${outputFile}`;
    const updatedCount = await albumRepository.updateAlbumCoverForRelease(
      friendId,
      releaseId,
      publicUrl
    );

    try {
      const updatedTracks = await albumRepository.getTracksForAlbumWithLibraryIdentifier(
        releaseId,
        friendId
      );
      if (updatedTracks.length > 0) {
        const { getMeiliClient } = await import("@/lib/meili");
        const meiliClient = getMeiliClient();
        const index = meiliClient.index("tracks");
        await index.updateDocuments(updatedTracks);
      }
    } catch (meiliErr) {
      console.warn("Failed to update MeiliSearch tracks for album cover sync:", meiliErr);
    }

    return NextResponse.json({
      success: true,
      release_id: releaseId,
      friend_id: friendId,
      audio_file_album_art_url: publicUrl,
      source_track_id: sourceTrackId,
      tracks_updated: updatedCount,
    });
  } catch (error) {
    console.error("Error extracting album cover from local audio:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
