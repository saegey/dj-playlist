import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execAsync = promisify(exec);

export interface AudioDownloadResult {
  filePath: string;
  wavPath: string;
  audioFileName: string;
  wavFileName: string;
}

export type Downloader = "freyr" | "spotdl" | "yt-dlp" | "scdl";

export interface AudioDownloadOptions {
  apple_music_url?: string;
  spotify_url?: string;
  youtube_url?: string;
  soundcloud_url?: string;
  preferred_downloader?: Downloader;
}

export class AudioService {
  private tmpDir: string;
  private audioDir: string;

  constructor() {
    this.tmpDir = path.join(process.cwd(), "tmp");
    this.audioDir = path.join(process.cwd(), "audio");

    // Ensure directories exist
    if (!fs.existsSync(this.tmpDir)) {
      fs.mkdirSync(this.tmpDir, { recursive: true });
    }
    if (!fs.existsSync(this.audioDir)) {
      fs.mkdirSync(this.audioDir, { recursive: true });
    }
  }

  async downloadAndConvertAudio(
    options: AudioDownloadOptions
  ): Promise<AudioDownloadResult> {
    const {
      apple_music_url,
      spotify_url,
      youtube_url,
      soundcloud_url,
      preferred_downloader,
    } = options;

    let filePath: string | null = null;

    // If a preferred downloader is specified, try that first for applicable URLs
    if (preferred_downloader && spotify_url) {
      if (preferred_downloader === "spotdl") {
        console.log(
          `Using preferred downloader SpotDL for Spotify: ${spotify_url}`
        );
        try {
          filePath = await this.downloadFromSpotDL(spotify_url);
        } catch (spotdlErr) {
          console.warn(
            "SpotDL download failed, will try fallback downloaders.",
            spotdlErr
          );
        }
      } else if (preferred_downloader === "freyr") {
        console.log(
          `Using preferred downloader Freyr for Spotify: ${spotify_url}`
        );
        try {
          filePath = await this.downloadFromSpotify(spotify_url);
        } catch (freyrErr) {
          console.warn(
            "Freyr download failed, will try fallback downloaders.",
            freyrErr
          );
        }
      }
    }

    // Fallback to original priority order if preferred downloader failed or wasn't specified

    // Try Apple Music first (only freyr supports this)
    if (!filePath && apple_music_url && preferred_downloader !== "spotdl") {
      console.log(`Downloading from Apple Music: ${apple_music_url}`);
      try {
        filePath = await this.downloadFromAppleMusic(apple_music_url);
      } catch (appleErr) {
        console.warn(
          "Apple Music download failed, will try next source.",
          appleErr
        );
      }
    }

    // Try Spotify if Apple failed (use freyr if spotdl wasn't already tried)
    if (!filePath && spotify_url && preferred_downloader !== "spotdl") {
      console.log(`Downloading from Spotify: ${spotify_url}`);
      try {
        filePath = await this.downloadFromSpotify(spotify_url);
      } catch (spotifyErr) {
        console.warn(
          "Spotify download failed, will try next source.",
          spotifyErr
        );
      }
    }

    // Try Spotify with SpotDL if freyr wasn't already tried
    if (!filePath && spotify_url && preferred_downloader !== "freyr") {
      console.log(`Downloading from Spotify with SpotDL: ${spotify_url}`);
      try {
        filePath = await this.downloadFromSpotDL(spotify_url);
      } catch (spotdlErr) {
        console.warn(
          "SpotDL download failed, will try next source.",
          spotdlErr
        );
      }
    }

    // Try YouTube if previous failed
    if (!filePath && youtube_url) {
      console.log(`Downloading from YouTube: ${youtube_url}`);
      try {
        filePath = await this.downloadFromYouTube(youtube_url);
      } catch (ytErr) {
        console.warn("YouTube download failed, will try next source.", ytErr);
      }
    }

    // Try SoundCloud if all others failed
    if (!filePath && soundcloud_url) {
      console.log(`Downloading from SoundCloud: ${soundcloud_url}`);
      try {
        filePath = await this.downloadFromSoundCloud(soundcloud_url);
      } catch (scErr) {
        throw new Error(
          `SoundCloud download failed: ${
            scErr instanceof Error ? scErr.message : String(scErr)
          }`
        );
      }
    }

    if (!filePath) {
      throw new Error(
        "No valid audio file could be downloaded from any source."
      );
    }

    // Convert to wav and move files
    const result = await this.convertAndSaveAudio(filePath);

    // Clean up temp file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return result;
  }

  private async downloadFromAppleMusic(url: string): Promise<string> {
    const appleOutDir = path.join(this.tmpDir, `apple_${Date.now()}`);
    fs.mkdirSync(appleOutDir, { recursive: true });

    console.log(`[AudioService] Starting Apple Music download: ${url}`);
    console.log(`[AudioService] Output directory: ${appleOutDir}`);

    const command = `freyr get --no-tree --directory "${appleOutDir}" "${url}"`;
    console.log(`[AudioService] Executing command: ${command}`);

    try {
      const { stdout, stderr } = await execAsync(command, { timeout: 120000 }); // 2 minute timeout
      console.log(`[AudioService] freyr stdout:`, stdout);
      if (stderr) {
        console.log(`[AudioService] freyr stderr:`, stderr);
      }
    } catch (error) {
      console.error(`[AudioService] freyr command failed:`, error);
      throw error;
    }

    const files = fs
      .readdirSync(appleOutDir)
      .filter((f) => f.endsWith(".m4a"))
      .map((f) => ({
        file: path.join(appleOutDir, f),
        mtime: fs.statSync(path.join(appleOutDir, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.mtime - a.mtime);

    console.log(
      `[AudioService] Found ${files.length} .m4a files in ${appleOutDir}`
    );

    if (files.length > 0 && fs.statSync(files[0].file).size > 0) {
      console.log(
        `[AudioService] Using file: ${files[0].file} (${
          fs.statSync(files[0].file).size
        } bytes)`
      );
      return files[0].file;
    } else {
      throw new Error("Downloaded .m4a file from Apple Music not found");
    }
  }

  private async downloadFromSpotify(url: string): Promise<string> {
    const spotifyOutDir = path.join(this.tmpDir, `spotify_${Date.now()}`);
    fs.mkdirSync(spotifyOutDir, { recursive: true });

    await execAsync(
      `freyr get --no-tree --directory "${spotifyOutDir}" "${url}"`
    );

    const files = fs
      .readdirSync(spotifyOutDir)
      .filter((f) => f.endsWith(".m4a"))
      .map((f) => ({
        file: path.join(spotifyOutDir, f),
        mtime: fs.statSync(path.join(spotifyOutDir, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.mtime - a.mtime);

    if (files.length > 0 && fs.statSync(files[0].file).size > 0) {
      return files[0].file;
    } else {
      throw new Error("Downloaded .m4a file from Spotify not found");
    }
  }

  private async downloadFromYouTube(url: string): Promise<string> {
    const ytOut = path.join(this.tmpDir, `youtube_${Date.now()}.m4a`);
    await execAsync(
      `yt-dlp -f bestaudio/best -x --audio-format m4a -o "${ytOut}" "${url}"`
    );

    if (fs.existsSync(ytOut) && fs.statSync(ytOut).size > 0) {
      return ytOut;
    } else {
      throw new Error("Downloaded .m4a file from YouTube not found");
    }
  }

  private async downloadFromSoundCloud(url: string): Promise<string> {
    await execAsync(
      `scdl -l "${url}" --path "${this.tmpDir}" --onlymp3 --addtofile`
    );

    const files = fs
      .readdirSync(this.tmpDir)
      .filter((f) => f.endsWith(".mp3"))
      .map((f) => ({
        file: path.join(this.tmpDir, f),
        mtime: fs.statSync(path.join(this.tmpDir, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.mtime - a.mtime);

    if (files.length > 0 && fs.statSync(files[0].file).size > 0) {
      return files[0].file;
    } else {
      throw new Error("Downloaded .mp3 file from SoundCloud not found");
    }
  }

  private async downloadFromSpotDL(url: string): Promise<string> {
    const spotdlOutDir = path.join(this.tmpDir, `spotdl_${Date.now()}`);
    fs.mkdirSync(spotdlOutDir, { recursive: true });

    console.log(`[AudioService] Starting SpotDL download: ${url}`);
    console.log(`[AudioService] Output directory: ${spotdlOutDir}`);

    const command = `spotdl download "${url}" --output "${spotdlOutDir}" --format mp3`;
    console.log(`[AudioService] Executing command: ${command}`);

    try {
      const { stdout, stderr } = await execAsync(command, { timeout: 120000 }); // 2 minute timeout
      console.log(`[AudioService] spotdl stdout:`, stdout);
      if (stderr) {
        console.log(`[AudioService] spotdl stderr:`, stderr);
      }
    } catch (error) {
      console.error(`[AudioService] spotdl command failed:`, error);
      throw error;
    }

    const files = fs
      .readdirSync(spotdlOutDir)
      .filter((f) => f.endsWith(".mp3"))
      .map((f) => ({
        file: path.join(spotdlOutDir, f),
        mtime: fs.statSync(path.join(spotdlOutDir, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.mtime - a.mtime);

    console.log(
      `[AudioService] Found ${files.length} .mp3 files in ${spotdlOutDir}`
    );

    if (files.length > 0 && fs.statSync(files[0].file).size > 0) {
      console.log(
        `[AudioService] Using file: ${files[0].file} (${
          fs.statSync(files[0].file).size
        } bytes)`
      );
      return files[0].file;
    } else {
      throw new Error("Downloaded .mp3 file from SpotDL not found");
    }
  }

  private async convertAndSaveAudio(
    filePath: string
  ): Promise<AudioDownloadResult> {
    const ext = path.extname(filePath).toLowerCase();
    const audioBaseName = `audio_${Date.now()}_${Math.floor(
      Math.random() * 1e6
    )}`;
    const audioFileName = `${audioBaseName}${ext}`;
    const audioDest = path.join(this.audioDir, audioFileName);

    const wavFileName = `${audioBaseName}.wav`;
    const wavDest = path.join(this.audioDir, wavFileName);

    // Convert to wav
    await execAsync(`ffmpeg -y -i "${filePath}" -ac 1 "${wavDest}"`);
    console.log("Converted to wav:", wavDest);

    // Copy original file
    fs.copyFileSync(filePath, audioDest);
    console.log("Audio saved to:", audioDest);

    return {
      filePath: audioDest,
      wavPath: wavDest,
      audioFileName,
      wavFileName,
    };
  }

  async cleanupWavFile(wavPath: string): Promise<void> {
    if (fs.existsSync(wavPath)) {
      fs.unlinkSync(wavPath);
      console.log("Cleaned up wav file:", wavPath);
    }
  }
}
