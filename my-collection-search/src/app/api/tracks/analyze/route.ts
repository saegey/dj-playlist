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
    const { apple_music_url, youtube_url } = await request.json();

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

      // Clean up - delete the downloaded files
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
      if (wavPath && fs.existsSync(wavPath)) fs.unlinkSync(wavPath);
      console.log("Temporary files deleted");

      return NextResponse.json(analysisResult);
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
