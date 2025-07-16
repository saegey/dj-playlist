import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

const execAsync = promisify(exec);
const tmpDir = path.join(process.cwd(), "tmp");

// Ensure tmp directory exists
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

const { MeiliSearch } = await import("meilisearch");
const client = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || "http://127.0.0.1:7700",
  apiKey: process.env.MEILISEARCH_API_KEY || "masterKey",
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { apple_music_url, youtube_url, soundcloud_url, track_id } = body;

    let filePath: string | null = null;
    let wavPath: string | null = null;
    // Download logic
    try {
      // Try Apple Music first
      if (apple_music_url) {
        console.log(`Downloading from Apple Music: ${apple_music_url}`);
        try {
          // Use a deterministic output directory
          const appleOutDir = path.join(tmpDir, `apple_${Date.now()}`);
          fs.mkdirSync(appleOutDir, { recursive: true });
          await execAsync(
            `freyr get --no-tree --directory "${appleOutDir}" "${apple_music_url}"`
          );
          // Find the newest .m4a file in the output directory
          const files = fs.readdirSync(appleOutDir)
            .filter(f => f.endsWith('.m4a'))
            .map(f => ({
              file: path.join(appleOutDir, f),
              mtime: fs.statSync(path.join(appleOutDir, f)).mtime.getTime()
            }))
            .sort((a, b) => b.mtime - a.mtime);
          if (files.length > 0 && fs.statSync(files[0].file).size > 0) {
            filePath = files[0].file;
          } else {
            throw new Error("Downloaded .m4a file from Apple Music not found");
          }
        } catch (appleErr) {
          console.warn(
            "Apple Music download failed, will try YouTube or SoundCloud if available.",
            appleErr
          );
        }
      }
      // Fallback to YouTube if Apple failed and youtube_url is present
      if (!filePath && youtube_url) {
        console.log(`Downloading from YouTube: ${youtube_url}`);
        try {
          // Download audio as .m4a using yt-dlp
          const ytOut = path.join(tmpDir, `youtube_${Date.now()}.m4a`);
          await execAsync(
            `yt-dlp -f bestaudio[ext=m4a] --extract-audio --audio-format m4a -o "${ytOut}" "${youtube_url}"`
          );
          if (fs.existsSync(ytOut) && fs.statSync(ytOut).size > 0) {
            filePath = ytOut;
          } else {
            throw new Error("Downloaded .m4a file from YouTube not found");
          }
        } catch (ytErr) {
          console.warn(
            "YouTube download failed, will try SoundCloud if available.",
            ytErr
          );
        }
      }
      // Fallback to SoundCloud if Apple and YouTube failed and soundcloud_url is present
      if (!filePath && soundcloud_url) {
        console.log(`Downloading from SoundCloud: ${soundcloud_url}`);
        try {
          // Use a deterministic output filename
          const scdlOut = path.join(tmpDir, `soundcloud_${Date.now()}.mp3`);
          await execAsync(
            `scdl -l "${soundcloud_url}" --path "${tmpDir}" --onlymp3 --addtofile --output "${scdlOut}"`
          );
          if (fs.existsSync(scdlOut) && fs.statSync(scdlOut).size > 0) {
            filePath = scdlOut;
          } else {
            throw new Error("Downloaded .mp3 file from SoundCloud not found");
          }
        } catch (scErr) {
          throw new Error(
            "SoundCloud download failed: " +
              (scErr instanceof Error ? scErr.message : String(scErr))
          );
        }
      }
      if (!filePath) {
        throw new Error(
          "No valid audio file could be downloaded from Apple Music, YouTube, or SoundCloud."
        );
      }
      // Convert audio to .wav using ffmpeg
      const ext = path.extname(filePath).toLowerCase();
      wavPath = filePath.replace(new RegExp(`${ext}$`), `_${Date.now()}.wav`);
      await execAsync(`ffmpeg -y -i "${filePath}" -ac 1 "${wavPath}"`);
      console.log("Converted to wav:", wavPath);

      // Call Python Essentia analysis script
      const pyScript = path.join(process.cwd(), "analyze_audio.py");
      let analysisResult;
      try {
        const { stdout } = await execAsync(
          `python3 "${pyScript}" "${wavPath}"`
        );
        analysisResult = JSON.parse(stdout);
      } catch (err) {
        throw new Error(
          "Python analysis failed: " +
            (err instanceof Error ? err.message : String(err))
        );
      }

      // Move the audio file to public/audio/ and keep it for playback
      const audioDir = path.join(process.cwd(), "public", "audio");
      if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });
      // Use a unique filename: audio_{timestamp}_{Math.random()}.{ext}
      const audioFileName = `audio_${Date.now()}_${Math.floor(
        Math.random() * 1e6
      )}${ext}`;
      const audioDest = path.join(audioDir, audioFileName);
      fs.copyFileSync(filePath, audioDest);
      // Clean up temp files
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
      if (wavPath && fs.existsSync(wavPath)) fs.unlinkSync(wavPath);
      console.log("Temporary files deleted, audio saved to:", audioDest);

      // Save the audio URL to the track record (requires track_id in request)
      const local_audio_url = `/audio/${audioFileName}`;

      if (track_id) {
        try {
          const { Pool } = await import("pg");
          const pool = new Pool({ connectionString: process.env.DATABASE_URL });
          console.debug("Updating track with local_audio_url:", {
            local_audio_url,
            track_id,
          });
          await pool.query(
            "UPDATE tracks SET local_audio_url = $1 WHERE track_id = $2",
            [local_audio_url, track_id]
          );

          // Fetch the updated track for MeiliSearch
          const { rows } = await pool.query(
            "SELECT * FROM tracks WHERE track_id = $1",
            [track_id]
          );
          if (rows && rows[0]) {
            console.debug("Track updated successfully:", rows[0]);
            try {
              const index = client.index("tracks");
              const res = await index.updateDocuments([rows[0]]);
              console.debug("MeiliSearch index updated successfully", res);
            } catch (meiliError) {
              console.error("Failed to update MeiliSearch:", meiliError);
            }
          }
        } catch (err) {
          console.warn("Could not update track with local_audio_url:", err);
        }
      }

      return NextResponse.json({ ...analysisResult, local_audio_url });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("Error during processing:", err);
      return NextResponse.json(
        { error: err.message || "Failed to process track" },
        { status: 500 }
      );
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("API error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
