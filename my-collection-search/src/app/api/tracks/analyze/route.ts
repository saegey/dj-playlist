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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { apple_music_url, youtube_url, track_id } = body;

    let filePath: string | null = null;
    let wavPath: string | null = null;
    let downloadedType: 'apple' | 'youtube' | null = null;
    try {
      // Try Apple Music first
      if (apple_music_url) {
        console.log(`Downloading from Apple Music: ${apple_music_url}`);
        try {
          await execAsync(`freyr get -d "${tmpDir}" "${apple_music_url}"`);
          // Recursively find the most recently modified .m4a file in tmpDir (size > 0)
          function findLatestM4aFile(dir: string): string | null {
            let latest: { path: string; mtime: number } | null = null;
            function walk(currentDir: string) {
              const entries = fs.readdirSync(currentDir, { withFileTypes: true });
              for (const entry of entries) {
                const fullPath = path.join(currentDir, entry.name);
                if (entry.isDirectory()) {
                  walk(fullPath);
                } else if (entry.isFile() && fullPath.endsWith(".m4a")) {
                  const stat = fs.statSync(fullPath);
                  if (stat.size > 0) {
                    if (!latest || stat.mtime.getTime() > latest.mtime) {
                      latest = { path: fullPath, mtime: stat.mtime.getTime() };
                    }
                  }
                }
              }
            }
            walk(dir);
            return latest ? latest.path : null;
          }
          filePath = findLatestM4aFile(tmpDir);
          if (!filePath) throw new Error("Downloaded .m4a file not found");
          downloadedType = 'apple';
        } catch (appleErr) {
          console.warn("Apple Music download failed, will try YouTube if available.", appleErr);
        }
      }
      // Fallback to YouTube if Apple failed and youtube_url is present
      if (!filePath && youtube_url) {
        console.log(`Downloading from YouTube: ${youtube_url}`);
        try {
          // Download audio as .m4a using yt-dlp
          // Output file: tmp/youtube_{timestamp}.m4a
          const ytOut = path.join(tmpDir, `youtube_${Date.now()}.m4a`);
          await execAsync(`yt-dlp -f bestaudio[ext=m4a] --extract-audio --audio-format m4a -o "${ytOut}" "${youtube_url}"`);
          if (fs.existsSync(ytOut) && fs.statSync(ytOut).size > 0) {
            filePath = ytOut;
            downloadedType = 'youtube';
          } else {
            throw new Error("Downloaded .m4a file from YouTube not found");
          }
        } catch (ytErr) {
          throw new Error("YouTube download failed: " + (ytErr && ytErr.message ? ytErr.message : ytErr));
        }
      }
      if (!filePath) {
        throw new Error("No valid audio file could be downloaded from Apple Music or YouTube.");
      }
      console.log(`File downloaded to: ${filePath}`);
      // Convert .m4a to .wav using ffmpeg
      wavPath = filePath.replace(/\.m4a$/, `_${Date.now()}.wav`);
      await execAsync(`ffmpeg -y -i "${filePath}" "${wavPath}"`);
      console.log("Converted to wav:", wavPath);

      // Call Python Essentia analysis script
      const pyScript = path.join(process.cwd(), "analyze_audio.py");
      let analysisResult;
      try {
        const { stdout } = await execAsync(`python3 "${pyScript}" "${wavPath}"`);
        analysisResult = JSON.parse(stdout);
      } catch (err) {
        throw new Error("Python analysis failed: " + (err && err.message ? err.message : err));
      }

      // Move the .m4a file to public/audio/ and keep it for playback
      const audioDir = path.join(process.cwd(), "public", "audio");
      if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });
      // Use a unique filename: audio_{timestamp}_{Math.random()}.m4a
      const audioFileName = `audio_${Date.now()}_${Math.floor(Math.random()*1e6)}.m4a`;
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
          const { Pool } = await import('pg');
          const pool = new Pool({ connectionString: process.env.DATABASE_URL });
          console.debug('Updating track with local_audio_url:', { local_audio_url, track_id });
          await pool.query('UPDATE tracks SET local_audio_url = $1 WHERE track_id = $2', [local_audio_url, track_id]);

          // Fetch the updated track for MeiliSearch
          const { rows } = await pool.query('SELECT * FROM tracks WHERE track_id = $1', [track_id]);
          if (rows && rows[0]) {
            console.debug('Track updated successfully:', rows[0]);
            try {
              const { MeiliSearch } = await import('meilisearch');
              const client = new MeiliSearch({ host: process.env.MEILISEARCH_HOST || 'http://127.0.0.1:7700', apiKey: process.env.MEILISEARCH_API_KEY || 'masterKey' });
              const index = client.index('tracks');
              const res = await index.updateDocuments([rows[0]]);
              console.debug('MeiliSearch index updated successfully', res);
            } catch (meiliError) {
              console.error('Failed to update MeiliSearch:', meiliError);
            }
          }
        } catch (err) {
          console.warn('Could not update track with local_audio_url:', err);
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
