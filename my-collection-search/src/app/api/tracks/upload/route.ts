import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import type { Pool } from "pg";

export const runtime = "nodejs"; // Ensure Node.js runtime for file system access

const execAsync = promisify(exec);

type AnalysisResult = {
  rhythm?: { bpm?: number; danceability?: number };
  tonal?: { key_edma?: { key?: string; scale?: string } };
  metadata?: { audio_properties?: { length?: number } };
};

// Helper function to update database and MeiliSearch
async function processAudioFile(
  pool: Pool,
  local_audio_url: string,
  track_id: string,
  analysisResult: AnalysisResult
) {
  const bpm = analysisResult?.rhythm?.bpm
    ? Math.round(analysisResult.rhythm.bpm)
    : null;
  const key = analysisResult?.tonal?.key_edma
    ? `${analysisResult.tonal.key_edma.key} ${analysisResult.tonal.key_edma.scale}`
    : null;
  const danceability =
    typeof analysisResult?.rhythm?.danceability === "number"
      ? analysisResult.rhythm.danceability
      : null;
  const duration_seconds = analysisResult?.metadata?.audio_properties?.length
    ? Math.round(analysisResult.metadata.audio_properties.length)
    : null;

  await pool.query(
    `UPDATE tracks SET local_audio_url = $1, bpm = $2, key = $3, danceability = $4, duration_seconds = $5 WHERE track_id = $6`,
    [local_audio_url, bpm, key, danceability, duration_seconds, track_id]
  );

  // Fetch updated track
  const { rows } = await pool.query(
    "SELECT * FROM tracks WHERE track_id = $1",
    [track_id]
  );
  if (rows && rows[0]) {
    try {
      const { getMeiliClient } = await import("@/lib/meili");
      const meiliClient = getMeiliClient();
      const index = meiliClient.index("tracks");
      await index.updateDocuments([rows[0]]);
    } catch (meiliError) {
      console.error("Failed to update MeiliSearch:", meiliError);
    }
  }
}

export async function POST(req: NextRequest) {
  // Parse multipart form data
  const formData = await req.formData();
  const file = formData.get("file");
  const track_id = formData.get("track_id");

  if (
    !file ||
    typeof file === "string" ||
    !track_id ||
    typeof track_id !== "string"
  ) {
    return NextResponse.json(
      { error: "Missing file or track_id" },
      { status: 400 }
    );
  }

  // Save file to /tmp or a desired directory
  const buffer = Buffer.from(await file.arrayBuffer());

  const tmpDir = path.join(process.cwd(), "tmp", "uploads");
  await fs.mkdir(tmpDir, { recursive: true });
  const filePath = path.join(tmpDir, `${track_id}_${file.name}`);
  await fs.writeFile(filePath, buffer);

  // Generate base name for this upload
  const baseName = `audio_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  // Convert to wav for Essentia and save in audio directory for public access
  const audioDir = path.join(process.cwd(), "audio");
  await fs.mkdir(audioDir, { recursive: true });
  const wavFileName = `${baseName}.wav`;
  const wavDest = path.join(audioDir, wavFileName);
  try {
    await execAsync(`ffmpeg -y -i "${filePath}" -ac 1 "${wavDest}"`);
  } catch (err) {
    return NextResponse.json(
      { error: "ffmpeg conversion failed", details: String(err) },
      { status: 500 }
    );
  }

  // Call Essentia API using the wav file
  let analysisResult: AnalysisResult;
  try {
    const essentiaApiUrl =
      process.env.ESSENTIA_API_URL || "http://essentia:8001/analyze";
    const fileUrl = `http://app:3000/api/audio?filename=${wavFileName}`;
    const res = await fetch(essentiaApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: fileUrl }),
    });
    const responseText = await res.json();
    if (!res.ok) {
      throw new Error(
        `Essentia API error: ${res.status} ${JSON.stringify(responseText)}`
      );
    }
    analysisResult = responseText;
  } catch (err) {
    return NextResponse.json(
      {
        error: `Essentia API call failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      },
      { status: 500 }
    );
  }

  // Convert and save as m4a (192kbps) to audio directory for playback
  let audioFileName = `${baseName}.m4a`;
  let audioDest = path.join(audioDir, audioFileName);
  let conversionFormat = "m4a";

  try {
    // Try with libfdk_aac first (better quality), fallback to aac if not available
    try {
      await execAsync(
        `ffmpeg -y -i "${filePath}" -c:a libfdk_aac -b:a 192k "${audioDest}"`
      );
    } catch (libfdkError) {
      console.warn("libfdk_aac not available, falling back to aac codec", libfdkError);
      await execAsync(
        `ffmpeg -y -i "${filePath}" -c:a aac -b:a 192k "${audioDest}"`
      );
    }
  } catch (err) {
    console.error("ffmpeg m4a conversion error:", err);
    // If m4a conversion fails, try to save as mp3 instead
    audioFileName = `${baseName}.mp3`;
    audioDest = path.join(audioDir, audioFileName);
    conversionFormat = "mp3";

    try {
      await execAsync(
        `ffmpeg -y -i "${filePath}" -c:a libmp3lame -b:a 192k "${audioDest}"`
      );
      console.warn(`Used MP3 instead of M4A for ${track_id}`);
    } catch (mp3Error) {
      return NextResponse.json(
        {
          error: "Audio conversion failed (tried m4a and mp3)",
          m4a_error: String(err),
          mp3_error: String(mp3Error),
        },
        { status: 500 }
      );
    }
  }

  const local_audio_url = audioFileName;

  // Clean up temp files (but keep the final audio file)
  try {
    if (filePath && (await fs.stat(filePath)).isFile())
      await fs.unlink(filePath);
    if (wavDest && (await fs.stat(wavDest)).isFile()) await fs.unlink(wavDest);
  } catch (cleanupErr) {
    console.warn("Cleanup warning:", cleanupErr);
  }

  // Update database and MeiliSearch
  try {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await processAudioFile(pool, local_audio_url, track_id, analysisResult);
  } catch (err) {
    console.warn(
      "Could not update track with local_audio_url or MeiliSearch:",
      err
    );
  }

  return NextResponse.json({
    success: true,
    file: file.name,
    track_id,
    analysis: analysisResult,
    local_audio_url,
    format: conversionFormat,
  });
}
