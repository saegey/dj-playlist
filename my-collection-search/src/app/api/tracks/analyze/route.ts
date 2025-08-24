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
  const { getMeiliClient } = await import("@/lib/meili");
  const meiliClient = getMeiliClient();

  try {
    const body = await request.json();
    const {
      apple_music_url,
      youtube_url,
      soundcloud_url,
      track_id,
      spotify_url,
    } = body;

    let filePath: string | null = null;
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
          const files = fs
            .readdirSync(appleOutDir)
            .filter((f) => f.endsWith(".m4a"))
            .map((f) => ({
              file: path.join(appleOutDir, f),
              mtime: fs.statSync(path.join(appleOutDir, f)).mtime.getTime(),
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
      // Try Spotify Music if available
      if (!filePath && spotify_url) {
        console.log(`Downloading from Spotify: ${spotify_url}`);
        try {
          const spotifyOutDir = path.join(tmpDir, `spotify_${Date.now()}`);
          fs.mkdirSync(spotifyOutDir, { recursive: true });
          await execAsync(
            `freyr get --no-tree --directory "${spotifyOutDir}" "${spotify_url}"`
          );
          // Find the newest .m4a file in the output directory
          const files = fs
            .readdirSync(spotifyOutDir)
            .filter((f) => f.endsWith(".m4a"))
            .map((f) => ({
              file: path.join(spotifyOutDir, f),
              mtime: fs.statSync(path.join(spotifyOutDir, f)).mtime.getTime(),
            }))
            .sort((a, b) => b.mtime - a.mtime);
          if (files.length > 0 && fs.statSync(files[0].file).size > 0) {
            filePath = files[0].file;
          } else {
            throw new Error("Downloaded .m4a file from Spotify not found");
          }
        } catch (spotifyErr) {
          console.warn(
            "Spotify download failed, will try YouTube or SoundCloud if available.",
            spotifyErr
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
            // Use a tolerant selector: download best available audio and transcode to m4a
            `yt-dlp -f bestaudio/best -x --audio-format m4a -o "${ytOut}" "${youtube_url}"`
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
          // Download to tmpDir using scdl, then find the newest .mp3 file
          await execAsync(
            `scdl -l "${soundcloud_url}" --path "${tmpDir}" --onlymp3 --addtofile`
          );
          // Find the newest .mp3 file in tmpDir
          const files = fs
            .readdirSync(tmpDir)
            .filter((f) => f.endsWith(".mp3"))
            .map((f) => ({
              file: path.join(tmpDir, f),
              mtime: fs.statSync(path.join(tmpDir, f)).mtime.getTime(),
            }))
            .sort((a, b) => b.mtime - a.mtime);
          if (files.length > 0 && fs.statSync(files[0].file).size > 0) {
            filePath = files[0].file;
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
      const audioDir = path.join(process.cwd(), "audio");
      if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

      // Convert audio to .wav using ffmpeg (handled after audioBaseName is set)
      const ext = path.extname(filePath).toLowerCase();
      const audioBaseName = `audio_${Date.now()}_${Math.floor(
        Math.random() * 1e6
      )}`;
      const audioFileName = `${audioBaseName}${ext}`;
      const audioDest = path.join(audioDir, audioFileName);

      const wavFileName = `${audioBaseName}.wav`;
      const wavDest = path.join(audioDir, wavFileName);
      await execAsync(`ffmpeg -y -i "${filePath}" -ac 1 "${wavDest}"`);
      console.log("Converted to wav:", wavDest);
      // Set wavPath to the API URL for the wav file

      // [After ffmpeg conversion]

      // Call Essentia API service
      let analysisResult;
      try {
        const essentiaApiUrl =
          process.env.ESSENTIA_API_URL || "http://essentia:8001/analyze";
        console.log(
          "Calling Essentia API:",
          essentiaApiUrl,
          "with file",
          `http://app:3000/api/audio?filename=${wavFileName}`
        );
        const res = await fetch(essentiaApiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: `http://app:3000/api/audio?filename=${wavFileName}`,
          }),
        });
        const responseText = await res.json();
        console.log("Essentia API response status:", res.status);
        if (!res.ok) {
          throw new Error(`Essentia API error: ${res.status} $responseText}`);
        }
        analysisResult = responseText;
      } catch (err) {
        throw new Error(
          `Essentia API call failed: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }

      // Move the audio file to public/audio/ and keep it for playback

      // Use a unique filename: audio_{timestamp}_{Math.random()}.{ext}

      fs.copyFileSync(filePath, audioDest);
      // Save the wav file with the same base name
      // Clean up temp files
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
      if (wavDest && fs.existsSync(wavDest)) fs.unlinkSync(wavDest);
      console.log("Temporary files deleted, audio saved to:", audioDest);

      // Save the audio URL to the track record (requires track_id in request)
      const local_audio_url = `${audioFileName}`;

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
            // console.debug("Track updated successfully:", rows[0]);
            try {
              const index = meiliClient.index("tracks");
              const res = await index.updateDocuments(rows);
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
