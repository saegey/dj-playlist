import { NextResponse } from "next/server";
import { Pool } from "pg";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { exec } from "child_process";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function POST() {
  // 1. Find tracks with missing duration_seconds and m4a audio
  const { rows } = await pool.query(
    "SELECT track_id, local_audio_url FROM tracks WHERE duration_seconds IS NULL AND local_audio_url LIKE '%.m4a'"
  );

  let updated = 0;
  const errors: { track_id: string; error: string }[] = [];
  const execAsync = promisify(exec);
  const tmpDir = path.join(process.cwd(), "tmp");
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  for (const row of rows) {
    try {
      console.debug(`[fix-missing-durations] Processing track_id: ${row.track_id}`);
      // Download the m4a file to tmp
      const audioUrl = `http://app:3000/api/audio?filename=${encodeURIComponent(row.local_audio_url)}`;
      const audioBaseName = `audio_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
      const m4aPath = path.join(tmpDir, `${audioBaseName}.m4a`);
      const wavPath = path.join(tmpDir, `${audioBaseName}.wav`);

      // Download file
      console.debug(`[fix-missing-durations] Downloading m4a from: ${audioUrl}`);
      const audioRes = await fetch(audioUrl);
      if (!audioRes.ok) throw new Error(`Failed to download audio: ${audioRes.status}`);
      const fileBuffer = Buffer.from(await audioRes.arrayBuffer());
      fs.writeFileSync(m4aPath, fileBuffer);
      console.debug(`[fix-missing-durations] Downloaded to: ${m4aPath}`);

      // Convert to wav
      console.debug(`[fix-missing-durations] Converting to wav: ${wavPath}`);
      await execAsync(`ffmpeg -y -i "${m4aPath}" -ac 1 "${wavPath}"`);
      if (!fs.existsSync(wavPath)) throw new Error("WAV conversion failed");
      console.debug(`[fix-missing-durations] Conversion complete: ${wavPath}`);

      // Copy wav to audio/ so it is accessible via /api/audio
      const audioDir = path.join(process.cwd(), "audio");
      if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });
      const audioWavPath = path.join(audioDir, path.basename(wavPath));
      fs.copyFileSync(wavPath, audioWavPath);
      console.debug(`[fix-missing-durations] Copied wav to audio/: ${audioWavPath}`);

      // Call Essentia API for duration
      const essentiaApiUrl = process.env.ESSENTIA_API_URL || "http://essentia:8001/analyze";
      const essentiaFileUrl = `http://app:3000/api/audio?filename=${encodeURIComponent(path.basename(wavPath))}`;
      console.debug(`[fix-missing-durations] Calling Essentia API: ${essentiaApiUrl} with file: ${essentiaFileUrl}`);
      const res = await fetch(essentiaApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: essentiaFileUrl }),
      });
      if (!res.ok) throw new Error(`Essentia API error: ${res.status}`);
      const data = await res.json();
      const duration = data?.metadata?.audio_properties?.length;
      console.debug(`[fix-missing-durations] Essentia returned duration: ${duration}`);
      if (typeof duration === "number" && duration > 0) {
        await pool.query(
          "UPDATE tracks SET duration_seconds = $1 WHERE track_id = $2",
          [Math.round(duration), row.track_id]
        );
        updated++;
        console.debug(`[fix-missing-durations] Updated DB for track_id: ${row.track_id} with duration: ${Math.round(duration)}`);
      } else {
        errors.push({ track_id: row.track_id, error: "No duration returned" });
        console.debug(`[fix-missing-durations] No duration returned for track_id: ${row.track_id}`);
      }

      // Clean up temp files
      if (fs.existsSync(m4aPath)) { fs.unlinkSync(m4aPath); console.debug(`[fix-missing-durations] Deleted: ${m4aPath}`); }
      if (fs.existsSync(wavPath)) { fs.unlinkSync(wavPath); console.debug(`[fix-missing-durations] Deleted: ${wavPath}`); }
      if (fs.existsSync(audioWavPath)) { fs.unlinkSync(audioWavPath); console.debug(`[fix-missing-durations] Deleted: ${audioWavPath}`); }
    } catch (err) {
      errors.push({ track_id: row.track_id, error: err instanceof Error ? err.message : String(err) });
      console.debug(`[fix-missing-durations] Error for track_id: ${row.track_id}:`, err);
    }
  }

  return NextResponse.json({ updated, errors });
}
