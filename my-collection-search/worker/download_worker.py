#!/usr/bin/env python3
"""
Download Worker - Processes audio download jobs from Redis queue
"""

import os
import json
import time
import traceback
from typing import Dict, Any, Optional
import shlex
import redis
import subprocess
import logging
import requests

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Redis connection
redis_conn = redis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379'))
ESSENTIA_DATA_DIR = os.getenv('ESSENTIA_DATA_DIR', '/app/essentia-data')


def run_subprocess(cmd: list[str], *, timeout: int = 300) -> subprocess.CompletedProcess:
    """Run a subprocess with logging for command, exit code, stdout, and stderr."""
    cmd_str = " ".join(shlex.quote(part) for part in cmd)
    logger.info(f"Executing command: {cmd_str}")
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        logger.error(f"Command timed out after {timeout}s: {cmd_str}")
        raise
    # Log outputs (trim very long outputs for readability)
    logger.info(f"Command exit code: {result.returncode}")
    if result.stdout:
        stdout_preview = result.stdout if len(result.stdout) < 4000 else result.stdout[:4000] + "\n...[truncated]"
        logger.info("Command stdout:\n%s", stdout_preview.strip())
    if result.stderr:
        stderr_preview = result.stderr if len(result.stderr) < 4000 else result.stderr[:4000] + "\n...[truncated]"
        # Always log stderr at info level for debugging
        logger.info("Command stderr:\n%s", stderr_preview.strip())
    return result

def update_job_status(job_id: str, status: str, progress: int = 0, error: str = None, result: Dict = None):
    """Update job status in Redis"""
    job_data = {
        'status': status,
        'progress': progress,
        'updated_at': int(time.time() * 1000),
    }

    if error:
        job_data['error'] = error
    if result:
        job_data['result'] = json.dumps(result)

    redis_conn.hset(f"job:{job_id}", mapping=job_data)
    logger.info(f"Job {job_id} status updated to {status} (progress: {progress}%)")

def cleanup_download_directory(download_dir: str, track_id: str):
    """Clean up download directory after successful processing"""
    try:
        import shutil

        # Remove any directories or files that might have been created for this download
        for item in os.listdir(download_dir):
            item_path = os.path.join(download_dir, item)
            try:
                if os.path.isdir(item_path):
                    # Remove directory and all contents
                    shutil.rmtree(item_path)
                    logger.info(f"Cleaned up directory: {item}")
                elif os.path.isfile(item_path):
                    # Remove individual files (shouldn't be many since we moved the main file)
                    os.unlink(item_path)
                    logger.info(f"Cleaned up file: {item}")
            except Exception as e:
                logger.warning(f"Could not clean up {item}: {e}")

        logger.info(f"Download directory cleanup completed for track {track_id}")
    except Exception as e:
        logger.error(f"Download directory cleanup failed: {e}")
        raise

def save_essentia_analysis_file(track_id: str, friend_id: int, analysis_data: Dict[str, Any]) -> str:
    """Persist raw Essentia analysis JSON per track/friend."""
    os.makedirs(ESSENTIA_DATA_DIR, exist_ok=True)
    safe_track_id = "".join(c if c.isalnum() or c in "._-" else "_" for c in track_id)
    file_path = os.path.join(ESSENTIA_DATA_DIR, f"{safe_track_id}_{friend_id}.json")
    payload = {
        "track_id": track_id,
        "friend_id": friend_id,
        "saved_at": int(time.time() * 1000),
        "analysis": analysis_data,
    }
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
        f.write("\n")
    return file_path

def analyze_audio_file(file_path: str, track_id: str, friend_id: int) -> Dict[str, Any]:
    """Analyze audio file using the app's analysis API"""
    try:
        # Convert to wav for analysis
        wav_path = file_path.replace(os.path.splitext(file_path)[1], '.wav')
        ffmpeg_cmd = ['ffmpeg', '-y', '-i', file_path, '-ac', '1', wav_path]
        logger.info(f"Converting audio to wav: {' '.join(ffmpeg_cmd)}")
        result = run_subprocess(ffmpeg_cmd, timeout=120)

        if result.returncode != 0:
            raise Exception(f"FFmpeg conversion failed: {result.stderr}")

        if not os.path.exists(wav_path) or os.path.getsize(wav_path) == 0:
            raise Exception("WAV conversion produced empty file")

        # Call Essentia API for analysis
        wav_filename = os.path.basename(wav_path)
        audio_url = f"http://app:3000/api/audio?filename={wav_filename}"

        essentia_url = os.getenv('ESSENTIA_API_URL', 'http://essentia:8001/analyze')
        logger.info(f"Calling Essentia API: {essentia_url} with audio: {audio_url}")

        response = requests.post(
            essentia_url,
            json={'filename': audio_url},
            timeout=300
        )

        if not response.ok:
            raise Exception(f"Essentia API error: {response.status_code} {response.text}")

        analysis_result = response.json()
        logger.info("Audio analysis completed successfully")
        try:
            saved_file = save_essentia_analysis_file(track_id, friend_id, analysis_result)
            logger.info("Saved Essentia analysis JSON to %s", saved_file)
        except Exception as save_err:
            logger.warning("Failed to save Essentia analysis JSON: %s", save_err)

        # Clean up wav file
        if os.path.exists(wav_path):
            os.unlink(wav_path)

        # Update database with analysis results
        update_track_analysis(track_id, friend_id, analysis_result)

        return analysis_result

    except Exception as e:
        logger.error(f"Audio analysis failed: {e}")
        # Clean up wav file on error
        wav_path = file_path.replace(os.path.splitext(file_path)[1], '.wav')
        if os.path.exists(wav_path):
            os.unlink(wav_path)
        raise

def update_track_analysis(track_id: str, friend_id: int, analysis_data: Dict[str, Any]):
    """Update track with analysis results via app API"""
    try:
        # Extract relevant fields from analysis
        bpm = None
        key = None
        danceability = None
        duration_seconds = None

        if 'rhythm' in analysis_data and analysis_data['rhythm']:
            rhythm = analysis_data['rhythm']
            if 'bpm' in rhythm and isinstance(rhythm['bpm'], (int, float)):
                bpm = int(round(rhythm['bpm']))
            if 'danceability' in rhythm and isinstance(rhythm['danceability'], (int, float)):
                danceability = round(rhythm['danceability'], 3)

        if 'tonal' in analysis_data and analysis_data['tonal']:
            tonal = analysis_data['tonal']
            if 'key_edma' in tonal and tonal['key_edma']:
                key_edma = tonal['key_edma']
                if 'key' in key_edma and 'scale' in key_edma:
                    key = f"{key_edma['key']} {key_edma['scale']}"

        if 'metadata' in analysis_data and analysis_data['metadata']:
            metadata = analysis_data['metadata']
            if 'audio_properties' in metadata and metadata['audio_properties']:
                audio_props = metadata['audio_properties']
                if 'length' in audio_props and isinstance(audio_props['length'], (int, float)):
                    duration_seconds = int(round(audio_props['length']))

        # Call app API to update track
        update_data = {
            'track_id': track_id,
            'friend_id': friend_id
        }

        if bpm is not None:
            update_data['bpm'] = bpm
        if key:
            update_data['key'] = key
        if danceability is not None:
            update_data['danceability'] = danceability
        if duration_seconds is not None:
            update_data['duration_seconds'] = duration_seconds

        # Call the tracks update API
        app_url = os.getenv('APP_URL', 'http://app:3000')
        update_url = f"{app_url}/api/tracks/update"

        logger.info(f"Updating track via API: {update_url}")
        response = requests.patch(
            update_url,
            json=update_data,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )

        if response.ok:
            logger.info(f"Track {track_id} updated successfully with analysis data")
        else:
            logger.warning(f"Failed to update track {track_id}: {response.status_code} {response.text}")

    except Exception as e:
        logger.error(f"Failed to update track analysis: {e}")
        # Don't raise - this is not critical enough to fail the whole job

def get_duration_seconds(file_path: str) -> int:
    """Get duration in seconds using ffprobe."""
    cmd = [
        "ffprobe",
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        file_path,
    ]
    result = run_subprocess(cmd, timeout=30)
    if result.returncode != 0:
        raise Exception(f"ffprobe failed: {result.stderr}")
    try:
        duration = float(result.stdout.strip())
    except Exception as e:
        raise Exception(f"ffprobe duration parse failed: {e}")
    if duration <= 0:
        raise Exception("ffprobe returned non-positive duration")
    return int(round(duration))

def ensure_local_audio_file(job_data: Dict[str, Any]) -> str:
    """Resolve or download the local audio file for duration analysis."""
    local_audio_url = job_data.get("local_audio_url")
    if not local_audio_url:
        raise Exception("Job missing local_audio_url")

    audio_dir = "/app/audio"
    # If local_audio_url is a full path, use it if it exists
    if os.path.exists(local_audio_url):
        return local_audio_url

    filename = os.path.basename(local_audio_url)
    candidate = os.path.join(audio_dir, filename)
    if os.path.exists(candidate):
        return candidate

    # Fallback: download from app API
    app_url = os.getenv("APP_URL", "http://app:3000")
    audio_url = f"{app_url}/api/audio?filename={filename}"
    tmp_path = f"/tmp/{filename}"
    logger.info(f"Downloading audio for duration check: {audio_url}")
    with requests.get(audio_url, stream=True, timeout=60) as response:
        if not response.ok:
            raise Exception(f"Failed to fetch audio: {response.status_code} {response.text}")
        with open(tmp_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    f.write(chunk)
    return tmp_path

def update_track_duration(track_id: str, friend_id: int, duration_seconds: int):
    """Update track duration via app API."""
    app_url = os.getenv('APP_URL', 'http://app:3000')
    update_url = f"{app_url}/api/tracks/update"
    update_data = {
        'track_id': track_id,
        'friend_id': friend_id,
        'duration_seconds': duration_seconds,
    }
    logger.info(f"Updating track duration via API: {update_url}")
    response = requests.patch(
        update_url,
        json=update_data,
        headers={'Content-Type': 'application/json'},
        timeout=30
    )
    if not response.ok:
        raise Exception(f"Failed to update duration: {response.status_code} {response.text}")

def update_track_album_art_url(track_id: str, friend_id: int, album_art_url: str):
    """Update track audio_file_album_art_url via app API."""
    app_url = os.getenv('APP_URL', 'http://app:3000')
    update_url = f"{app_url}/api/tracks/update"
    update_data = {
        'track_id': track_id,
        'friend_id': friend_id,
        'audio_file_album_art_url': album_art_url,
    }
    logger.info(f"Updating track album art via API: {update_url}")
    response = requests.patch(
        update_url,
        json=update_data,
        headers={'Content-Type': 'application/json'},
        timeout=30
    )
    if not response.ok:
        raise Exception(f"Failed to update album art url: {response.status_code} {response.text}")

def get_embedded_art_stream_index(file_path: str) -> Optional[int]:
    """Return the ffprobe stream index for embedded album art, if present."""
    cmd = [
        "ffprobe",
        "-v", "quiet",
        "-print_format", "json",
        "-show_streams",
        file_path,
    ]
    result = run_subprocess(cmd, timeout=30)
    if result.returncode != 0:
        raise Exception(f"ffprobe stream probe failed: {result.stderr}")

    try:
        payload = json.loads(result.stdout or "{}")
    except Exception as e:
        raise Exception(f"ffprobe json parse failed: {e}")

    streams = payload.get("streams", [])
    for stream in streams:
        disposition = stream.get("disposition") or {}
        if disposition.get("attached_pic") == 1:
            idx = stream.get("index")
            if isinstance(idx, int):
                return idx

    for stream in streams:
        if stream.get("codec_type") == "video":
            idx = stream.get("index")
            if isinstance(idx, int):
                return idx

    return None

def extract_embedded_cover_art(job_data: Dict[str, Any]) -> Dict[str, Any]:
    """Extract embedded cover art from local audio and persist URL on the track."""
    track_id = job_data['track_id']
    friend_id = job_data['friend_id']
    job_id = job_data.get('job_id', f"{track_id}_{int(time.time())}")

    logger.info(f"Starting cover art extraction job {job_id} for track {track_id}")
    update_job_status(job_id, 'processing', 10)

    try:
        audio_path = ensure_local_audio_file(job_data)
        update_job_status(job_id, 'processing', 35)

        stream_index = get_embedded_art_stream_index(audio_path)
        if stream_index is None:
            raise Exception("No embedded cover art stream found")

        output_dir = "/app/public/uploads/album-covers"
        os.makedirs(output_dir, exist_ok=True)
        safe_track_id = "".join(c if c.isalnum() or c in "._-" else "_" for c in track_id)
        output_file = f"{safe_track_id}_{friend_id}.jpg"
        output_path = os.path.join(output_dir, output_file)

        ffmpeg_cmd = [
            "ffmpeg",
            "-y",
            "-i", audio_path,
            "-map", f"0:{stream_index}",
            "-frames:v", "1",
            output_path,
        ]
        result = run_subprocess(ffmpeg_cmd, timeout=60)
        if result.returncode != 0:
            raise Exception(f"ffmpeg cover extraction failed: {result.stderr}")

        update_job_status(job_id, 'processing', 80)
        public_url = f"/uploads/album-covers/{output_file}"
        update_track_album_art_url(track_id, friend_id, public_url)

        payload_local_audio_url = (job_data.get("local_audio_url") or "").strip()
        if audio_path.startswith("/tmp/") and (not payload_local_audio_url or not os.path.exists(payload_local_audio_url)):
            try:
                os.unlink(audio_path)
            except Exception:
                pass

        result_payload = {
            'success': True,
            'track_id': track_id,
            'friend_id': friend_id,
            'audio_file_album_art_url': public_url,
        }
        update_job_status(job_id, 'completed', 100, result=result_payload)
        logger.info(f"Cover art job {job_id} completed successfully")
        return result_payload
    except Exception as e:
        error_msg = f"Cover art extraction failed: {str(e)}"
        logger.error(f"Job {job_id} failed: {error_msg}")
        logger.error(traceback.format_exc())
        update_job_status(job_id, 'failed', 0, error=error_msg)
        return {
            'success': False,
            'error': error_msg,
            'track_id': track_id,
            'friend_id': friend_id
        }

def extract_embedded_cover_art_album(job_data: Dict[str, Any]) -> Dict[str, Any]:
    """Extract one embedded cover for an album and apply it across album tracks."""
    track_id = job_data['track_id']
    friend_id = job_data['friend_id']
    release_id = job_data.get('release_id')
    job_id = job_data.get('job_id', f"{track_id}_{int(time.time())}")

    logger.info(
        "Starting album cover extraction job %s for release %s (friend %s)",
        job_id,
        release_id,
        friend_id,
    )
    update_job_status(job_id, 'processing', 10)

    try:
        if not release_id:
            raise Exception("Missing release_id for extract-cover-art-album job")

        app_url = os.getenv('APP_URL', 'http://app:3000')
        endpoint = f"{app_url}/api/albums/extract-cover-art-from-audio"
        payload = {
            "release_id": release_id,
            "friend_id": friend_id,
        }
        update_job_status(job_id, 'processing', 60)
        response = requests.post(
            endpoint,
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=180,
        )
        if not response.ok:
            raise Exception(
                f"Album cover extraction API failed: {response.status_code} {response.text}"
            )
        result_payload = response.json()
        result_payload['success'] = True
        update_job_status(job_id, 'completed', 100, result=result_payload)
        logger.info("Album cover extraction job %s completed", job_id)
        return result_payload
    except Exception as e:
        error_msg = f"Album cover extraction failed: {str(e)}"
        logger.error(f"Job {job_id} failed: {error_msg}")
        logger.error(traceback.format_exc())
        update_job_status(job_id, 'failed', 0, error=error_msg)
        return {
            'success': False,
            'error': error_msg,
            'track_id': track_id,
            'friend_id': friend_id,
            'release_id': release_id,
        }

def fix_duration(job_data: Dict[str, Any]) -> Dict[str, Any]:
    """Fix missing duration using existing local audio."""
    track_id = job_data['track_id']
    friend_id = job_data['friend_id']
    job_id = job_data.get('job_id', f"{track_id}_{int(time.time())}")

    logger.info(f"Starting duration fix job {job_id} for track {track_id}")
    update_job_status(job_id, 'processing', 10)

    try:
        audio_path = ensure_local_audio_file(job_data)
        update_job_status(job_id, 'processing', 50)
        duration_seconds = get_duration_seconds(audio_path)
        update_job_status(job_id, 'processing', 80)
        update_track_duration(track_id, friend_id, duration_seconds)

        result = {
            'success': True,
            'track_id': track_id,
            'friend_id': friend_id,
            'duration_seconds': duration_seconds,
        }
        update_job_status(job_id, 'completed', 100, result=result)
        logger.info(f"Duration job {job_id} completed successfully")
        return result

    except Exception as e:
        error_msg = f"Duration fix failed: {str(e)}"
        logger.error(f"Job {job_id} failed: {error_msg}")
        logger.error(traceback.format_exc())
        update_job_status(job_id, 'failed', 0, error=error_msg)
        return {
            'success': False,
            'error': error_msg,
            'track_id': track_id,
            'friend_id': friend_id
        }

def analyze_local_audio(job_data: Dict[str, Any]) -> Dict[str, Any]:
    """Run Essentia analysis against an existing local audio file."""
    track_id = job_data['track_id']
    friend_id = job_data['friend_id']
    job_id = job_data.get('job_id', f"{track_id}_{int(time.time())}")

    logger.info(f"Starting local analysis job {job_id} for track {track_id}")
    update_job_status(job_id, 'processing', 10)

    try:
        audio_path = ensure_local_audio_file(job_data)
        update_job_status(job_id, 'processing', 35)
        analysis_result = analyze_audio_file(audio_path, track_id, friend_id)
        update_job_status(job_id, 'processing', 90)

        result_payload = {
            'success': True,
            'track_id': track_id,
            'friend_id': friend_id,
            'analysis': analysis_result,
        }
        update_job_status(job_id, 'completed', 100, result=result_payload)
        logger.info(f"Local analysis job {job_id} completed successfully")
        return result_payload
    except Exception as e:
        error_msg = f"Local analysis failed: {str(e)}"
        logger.error(f"Job {job_id} failed: {error_msg}")
        logger.error(traceback.format_exc())
        update_job_status(job_id, 'failed', 0, error=error_msg)
        return {
            'success': False,
            'error': error_msg,
            'track_id': track_id,
            'friend_id': friend_id
        }

def has_download_urls(job_data: Dict[str, Any]) -> bool:
    """Return True if at least one remote source URL is present."""
    for key in ['apple_music_url', 'spotify_url', 'youtube_url', 'soundcloud_url']:
        value = job_data.get(key)
        if isinstance(value, str) and value.strip():
            return True
    return False

def download_audio(job_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Download audio from various sources
    """
    track_id = job_data['track_id']
    friend_id = job_data['friend_id']
    job_id = job_data.get('job_id', f"{track_id}_{int(time.time())}")

    logger.info(f"Starting download job {job_id} for track {track_id}")
    logger.info(f"Job data: {job_data}")

    # Debug: Log the specific URLs being processed
    urls_found = []
    for url_key in ['apple_music_url', 'spotify_url', 'youtube_url', 'soundcloud_url']:
        if url_key in job_data and job_data[url_key]:
            urls_found.append(f"{url_key}: {job_data[url_key]}")
    logger.info(f"URLs available for download: {urls_found}")

    # Update status to processing
    update_job_status(job_id, 'processing', 10)

    try:
        # Use separate download directory to avoid conflicts with existing audio files
        download_dir = "/app/downloads"
        final_audio_dir = "/app/audio"
        os.makedirs(download_dir, exist_ok=True)
        os.makedirs(final_audio_dir, exist_ok=True)
        logger.info(f"Download directory: {download_dir}")
        logger.info(f"Final audio directory: {final_audio_dir}")

        # Check which download tools are available
        logger.info("Checking available download tools...")
        try:
            gamdl_check = run_subprocess(['gamdl', '--version'], timeout=10)
            logger.info(f"gamdl available: exit code {gamdl_check.returncode}")
        except Exception as e:
            logger.warning(f"gamdl not available: {e}")

        try:
            ytdlp_check = run_subprocess(['yt-dlp', '--version'], timeout=10)
            logger.info(f"yt-dlp available: exit code {ytdlp_check.returncode}")
        except Exception as e:
            logger.warning(f"yt-dlp not available: {e}")

        # Try different download sources in order of preference
        sources = [
            ('apple_music_url', 'gamdl'),  # gamdl for Apple Music URLs
            ('youtube_url', 'yt-dlp'),
            ('soundcloud_url', 'yt-dlp'),
        ]

        downloaded_file = None
        logger.info(f"Available sources in job data: {[key for key in sources if job_data.get(key[0])]}")

        for url_key, downloader in sources:
            if url_key in job_data and job_data[url_key]:
                url = job_data[url_key]
                logger.info(f"Attempting download with {downloader} from {url_key}: {url}")

                update_job_status(job_id, 'processing', 30)

                try:
                    if downloader == 'gamdl':
                        downloaded_file = download_with_gamdl(url, download_dir, track_id, job_data)
                    elif downloader == 'yt-dlp':
                        downloaded_file = download_with_ytdlp(url, download_dir, track_id)

                    if downloaded_file:
                        logger.info(f"Successfully downloaded: {downloaded_file}")
                        break

                except Exception as e:
                    logger.warning(f"Download failed with {downloader}: {str(e)}")
                    continue
            else:
                logger.info(f"Skipping {url_key} - not provided or empty")

        if not downloaded_file:
            available_urls = [f"{k}: {job_data.get(k, 'None')}" for k, _ in sources]
            raise Exception(f"All download methods failed. Available URLs: {available_urls}")

        update_job_status(job_id, 'processing', 60)

        # Move downloaded file to final audio directory
        try:
            import shutil

            # Create final filename
            file_ext = os.path.splitext(downloaded_file)[1]
            final_filename = f"{track_id}{file_ext}"
            final_file_path = os.path.join(final_audio_dir, final_filename)

            # Move file from download dir to audio dir
            shutil.move(downloaded_file, final_file_path)
            logger.info(f"Moved file from {downloaded_file} to {final_file_path}")

            # Update downloaded_file reference to point to final location
            downloaded_file = final_file_path

        except Exception as e:
            logger.error(f"Failed to move file to final directory: {e}")
            raise Exception(f"File processing failed: {e}")

        # Update track with local audio URL
        try:
            # Get just the filename for the database
            audio_filename = os.path.basename(downloaded_file)
            update_data = {
                'track_id': track_id,
                'friend_id': friend_id,
                'local_audio_url': audio_filename
            }

            app_url = os.getenv('APP_URL', 'http://app:3000')
            update_url = f"{app_url}/api/tracks/update"

            logger.info(f"Updating track with local_audio_url: {audio_filename}")
            logger.info(f"Update URL: {update_url}")
            logger.info(f"Update data: {update_data}")

            response = requests.patch(
                update_url,
                json=update_data,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )

            logger.info(f"Database update response: {response.status_code}")
            if response.ok:
                logger.info(f"Successfully updated database with local_audio_url: {audio_filename}")
                try:
                    response_data = response.json()
                    logger.info(f"Response data: {response_data}")
                except:
                    logger.info("Response body not JSON")
            else:
                logger.error(f"Failed to update local_audio_url: {response.status_code} {response.text}")

        except Exception as e:
            logger.warning(f"Failed to update local_audio_url: {e}")

        update_job_status(job_id, 'processing', 80)

        # Perform audio analysis
        analysis_result = None
        try:
            logger.info(f"Starting audio analysis for {downloaded_file}")
            analysis_result = analyze_audio_file(downloaded_file, track_id, friend_id)
            logger.info("Audio analysis completed successfully")
        except Exception as e:
            logger.warning(f"Audio analysis failed (continuing with download success): {e}")
            # Analysis failure doesn't fail the whole job - download was successful

        update_job_status(job_id, 'processing', 95)

        # Trigger MPD database update so new file is available for playback
        try:
            app_url = os.getenv('APP_URL', 'http://app:3000')
            update_db_url = f"{app_url}/api/playback/update-db"
            logger.info(f"Triggering MPD database update: {update_db_url}")

            response = requests.post(update_db_url, timeout=10)
            if response.ok:
                logger.info("MPD database update triggered successfully")
            else:
                logger.warning(f"MPD database update failed: {response.status_code} {response.text}")
        except Exception as e:
            logger.warning(f"Could not trigger MPD database update: {e}")
            # Don't fail the job if MPD update fails

        # Return success result
        result = {
            'success': True,
            'local_audio_url': os.path.basename(downloaded_file),
            'track_id': track_id,
            'friend_id': friend_id
        }

        if analysis_result:
            result['analysis'] = analysis_result

        # Clean up download directory - remove any remaining files/folders for this job
        try:
            cleanup_download_directory(download_dir, track_id)
        except Exception as e:
            logger.warning(f"Download directory cleanup failed (non-critical): {e}")

        update_job_status(job_id, 'completed', 100, result=result)
        logger.info(f"Job {job_id} completed successfully")

        return result

    except Exception as e:
        error_msg = f"Download failed: {str(e)}"
        logger.error(f"Job {job_id} failed: {error_msg}")
        logger.error(traceback.format_exc())

        update_job_status(job_id, 'failed', 0, error=error_msg)

        return {
            'success': False,
            'error': error_msg,
            'track_id': track_id,
            'friend_id': friend_id
        }

def download_with_gamdl(url: str, output_dir: str, track_id: str, job_data: Dict[str, Any] = None) -> Optional[str]:
    """Download using gamdl (Apple Music downloader)"""
    try:
        # Get quality preference from job data or use default
        quality = 'best'  # Default to best available
        if job_data and 'quality' in job_data:
            quality = job_data['quality']

        # Get format preference from job data or use default
        audio_format = 'm4a'  # Apple's native format
        if job_data and 'format' in job_data:
            audio_format = job_data['format']

        # gamdl specific options with enhanced parameters
        cmd = [
            'gamdl',
            '--output-path', output_dir,
            '--log-level', 'INFO',
            '--no-exceptions',  # Don't print full exceptions to keep logs clean
        ]

        # Add quality settings if not 'best' (which is default)
        if quality != 'best':
            cmd.extend(['--audio-quality', quality])

        # Validate and add cookie file
        cookie_file = os.getenv('GAMDL_COOKIE_FILE')
        if cookie_file:
            if os.path.exists(cookie_file):
                # Validate cookie file is readable and has content
                try:
                    with open(cookie_file, 'r') as f:
                        content = f.read().strip()
                        if not content:
                            logger.warning("Cookie file is empty")
                        elif 'apple' not in content.lower():
                            logger.warning("Cookie file may not contain Apple Music cookies")
                        else:
                            cmd.extend(['--cookies-path', cookie_file])
                            logger.info(f"Using validated cookie file: {cookie_file}")

                            # Check if cookies contain recent timestamp
                            lines = content.split('\n')
                            apple_lines = [line for line in lines if 'apple' in line.lower()]
                            logger.info(f"Found {len(apple_lines)} Apple-related cookie entries")

                except Exception as e:
                    logger.warning(f"Could not validate cookie file: {e}")
            else:
                logger.warning(f"Cookie file specified but not found: {cookie_file}")
        else:
            logger.info("No cookie file specified - downloads may be limited")

        # Find files before download to detect new ones
        before_files = set()
        try:
            before_files = set(os.listdir(output_dir))
        except:
            pass

        # Add the URL last
        cmd.append(url)

        logger.info(f"Executing gamdl with quality={quality}, format={audio_format}")
        logger.info(f"Target URL: {url}")
        logger.info(f"Expected track for track_id: {track_id}")
        result = run_subprocess(cmd, timeout=600)  # Increased timeout for high quality downloads

        # Parse gamdl output to see what it actually processed
        if result.stderr:
            import re
            # Look for track processing lines like "(Track 1/1 from URL 1/1) "Track Name""
            track_matches = re.findall(r'\(Track \d+/\d+ from URL \d+/\d+\) "([^"]+)"', result.stderr)
            if track_matches:
                logger.info(f"gamdl processed tracks: {track_matches}")
                for i, track_name in enumerate(track_matches):
                    logger.warning(f"VERIFY: gamdl downloaded track #{i+1}: '{track_name}' for track_id {track_id}")

            # Look for URL processing
            url_matches = re.findall(r'Processing "([^"]+)"', result.stderr)
            if url_matches:
                logger.info(f"gamdl processed URLs: {url_matches}")
                if url_matches[0] != url:
                    logger.error(f"URL MISMATCH: Expected {url}, gamdl processed {url_matches[0]}")
        else:
            logger.warning("No stderr output from gamdl - this is unusual")

        # Enhanced error handling for gamdl-specific errors
        if result.returncode != 0:
            stderr_lower = result.stderr.lower() if result.stderr else ""

            # Check for specific gamdl error types
            if "unauthorized" in stderr_lower or "401" in stderr_lower:
                raise Exception("Authentication failed - cookie file may be expired or invalid")
            elif "not found" in stderr_lower or "404" in stderr_lower:
                raise Exception("Track not found on Apple Music")
            elif "region" in stderr_lower or "geo" in stderr_lower:
                raise Exception("Track not available in your region")
            elif "rate limit" in stderr_lower or "too many requests" in stderr_lower:
                raise Exception("Rate limited by Apple Music - please try again later")
            elif "premium" in stderr_lower or "subscription" in stderr_lower:
                raise Exception("Apple Music subscription required")
            else:
                raise Exception(f"gamdl failed: {result.stderr}")

        # Check if gamdl found existing files (parse stderr output)
        existing_file_path = None
        if result.stderr:
            import re
            # Look for "Media file already exists at '/path/to/file.m4a', skipping"
            existing_match = re.search(r"Media file already exists at '([^']+)'", result.stderr)
            if existing_match:
                existing_file_path = existing_match.group(1)
                logger.info(f"gamdl found existing file: {existing_file_path}")

                # Extract artist/track info from file path for verification
                path_parts = existing_file_path.split('/')
                if len(path_parts) >= 3:
                    artist_folder = path_parts[-3] if len(path_parts) > 2 else "Unknown"
                    album_folder = path_parts[-2] if len(path_parts) > 1 else "Unknown"
                    filename = path_parts[-1] if path_parts else "Unknown"
                    logger.info(f"Downloaded artist/album/track: {artist_folder} / {album_folder} / {filename}")
                    logger.warning(f"VERIFY: Expected track_id {track_id}, got file in {artist_folder} folder")

                # Verify the file exists and is valid
                if os.path.exists(existing_file_path) and os.path.getsize(existing_file_path) > 0:
                    logger.info(f"Using existing file: {existing_file_path} (size: {os.path.getsize(existing_file_path)} bytes)")

                    # Move/rename to standardized location
                    file_ext = os.path.splitext(existing_file_path)[1]
                    new_filename = f"{track_id}{file_ext}"
                    new_filepath = os.path.join(output_dir, new_filename)

                    try:
                        import shutil
                        shutil.copy2(existing_file_path, new_filepath)  # Copy to download dir first
                        logger.info(f"Copied existing file to download dir: {new_filename}")
                        return new_filepath
                    except Exception as e:
                        logger.warning(f"Could not copy file: {e}, using original path")
                        return existing_file_path
                else:
                    logger.warning(f"Existing file path invalid or empty: {existing_file_path}")
                    existing_file_path = None

        # Find new files and directories that were created
        try:
            after_files = set(os.listdir(output_dir))
            new_items = after_files - before_files
        except:
            new_items = set()

        logger.info(f"New items created: {new_items}")

        # If no new items were created, gamdl might have skipped due to existing files
        # Let's search the entire output directory for audio files
        search_all_files = len(new_items) == 0
        if search_all_files:
            logger.info("No new items detected, searching entire directory for existing audio files")

        # Recursively search for audio files
        downloaded_files = []

        def find_audio_files(search_path, max_depth=3, current_depth=0):
            """Recursively find audio files with depth limit"""
            if current_depth > max_depth:
                return

            try:
                for item in os.listdir(search_path):
                    item_path = os.path.join(search_path, item)

                    if os.path.isfile(item_path):
                        # Check if it's an audio file
                        if any(item.endswith(ext) for ext in ['.m4a', '.mp3', '.aac', '.flac']):
                            if os.path.getsize(item_path) > 0:
                                downloaded_files.append(item_path)
                                logger.info(f"Found audio file: {item_path} (size: {os.path.getsize(item_path)} bytes)")
                    elif os.path.isdir(item_path) and current_depth < max_depth:
                        # Recursively search subdirectories
                        find_audio_files(item_path, max_depth, current_depth + 1)
            except Exception as e:
                logger.warning(f"Error searching {search_path}: {e}")

        if search_all_files:
            # Search the entire output directory for audio files
            logger.info("Searching entire output directory for audio files")
            find_audio_files(output_dir)
        else:
            # Search only in new directories and check direct files
            for item in new_items:
                item_path = os.path.join(output_dir, item)

                if os.path.isdir(item_path):
                    logger.info(f"Searching new directory: {item}")
                    find_audio_files(item_path)
                elif os.path.isfile(item_path):
                    # Check if it's a direct audio file
                    if any(item.endswith(ext) for ext in ['.m4a', '.mp3', '.aac', '.flac']):
                        if os.path.getsize(item_path) > 0:
                            downloaded_files.append(item_path)
                            logger.info(f"Found direct audio file: {item} (size: {os.path.getsize(item_path)} bytes)")

        if not downloaded_files:
            # Enhanced debugging - show directory structure
            logger.error(f"No audio files found. Debug info:")
            logger.error(f"Files before: {before_files}")
            logger.error(f"Files after: {after_files}")
            logger.error(f"New items: {new_items}")

            # Show structure of new directories
            for item in new_items:
                item_path = os.path.join(output_dir, item)
                if os.path.isdir(item_path):
                    try:
                        subfiles = os.listdir(item_path)
                        logger.error(f"Contents of new directory '{item}': {subfiles}")
                        for subfile in subfiles:
                            subfile_path = os.path.join(item_path, subfile)
                            if os.path.isfile(subfile_path):
                                size = os.path.getsize(subfile_path)
                                logger.error(f"  File: {subfile} (size: {size} bytes)")
                            elif os.path.isdir(subfile_path):
                                try:
                                    subsubfiles = os.listdir(subfile_path)
                                    logger.error(f"  Subdirectory '{subfile}': {subsubfiles}")
                                except Exception as e:
                                    logger.error(f"  Error reading subdirectory '{subfile}': {e}")
                    except Exception as e:
                        logger.error(f"Error reading directory {item}: {e}")

            raise Exception(f"Downloaded file not found for track_id {track_id}")

        # Return the best quality file (largest file size typically)
        best_file = max(downloaded_files, key=os.path.getsize)
        logger.info(f"Selected best quality file: {best_file}")

        # Just return the file path - main download function will handle moving to final location
        return best_file

    except subprocess.TimeoutExpired:
        raise Exception("Download timeout (10 minutes) - try lower quality or check connection")
    except Exception as e:
        # Enhanced error context
        error_msg = str(e)
        if "gamdl error:" not in error_msg:
            error_msg = f"gamdl error: {error_msg}"
        logger.error(f"gamdl download failed for {url}: {error_msg}")
        raise Exception(error_msg)

def download_with_ytdlp(url: str, output_dir: str, track_id: str) -> Optional[str]:
    """Download using yt-dlp with robust format selection"""
    try:
        output_template = f"{output_dir}/{track_id}.%(ext)s"

        # Try multiple strategies for YouTube downloads
        strategies = [
            # Strategy 1: Android client with multiple format options
            {
                'args': [
                    'yt-dlp',
                    '--extractor-args', 'youtube:player_client=android',
                    '-f', 'bestaudio[ext=m4a]/bestaudio/best',
                    '-x',
                    '--audio-format', 'm4a',
                    '--no-playlist',
                    '--output', output_template,
                    url
                ],
                'name': 'Android client'
            },
            # Strategy 2: iOS client
            {
                'args': [
                    'yt-dlp',
                    '--extractor-args', 'youtube:player_client=ios',
                    '-f', 'bestaudio/best',
                    '-x',
                    '--audio-format', 'm4a',
                    '--no-playlist',
                    '--output', output_template,
                    url
                ],
                'name': 'iOS client'
            },
            # Strategy 3: Web client with legacy format selection
            {
                'args': [
                    'yt-dlp',
                    '--extractor-args', 'youtube:player_client=web',
                    '-f', 'ba/b',
                    '-x',
                    '--audio-format', 'm4a',
                    '--output', output_template,
                    url
                ],
                'name': 'Web client'
            },
            # Strategy 4: No client specification, any audio format
            {
                'args': [
                    'yt-dlp',
                    '-f', 'bestaudio/best',
                    '-x',
                    '--audio-format', 'm4a',
                    '--output', output_template,
                    url
                ],
                'name': 'Default extraction'
            },
        ]

        last_error = None
        for i, strategy in enumerate(strategies, 1):
            logger.info(f"Trying strategy {i}/{len(strategies)}: {strategy['name']}")
            try:
                result = run_subprocess(strategy['args'], timeout=300)

                if result.returncode == 0:
                    # Find the downloaded file
                    for file in os.listdir(output_dir):
                        if file.startswith(track_id) and (file.endswith('.m4a') or file.endswith('.mp3')):
                            logger.info(f"Successfully downloaded with strategy: {strategy['name']}")
                            return os.path.join(output_dir, file)

                    logger.warning(f"Strategy {strategy['name']} completed but file not found")
                else:
                    last_error = result.stderr
                    logger.warning(f"Strategy {strategy['name']} failed with exit code {result.returncode}")

            except subprocess.TimeoutExpired:
                logger.warning(f"Strategy {strategy['name']} timed out")
                last_error = "Download timeout"
            except Exception as e:
                logger.warning(f"Strategy {strategy['name']} error: {e}")
                last_error = str(e)

        # All strategies failed
        error_msg = f"All download strategies failed. Last error: {last_error}"
        raise Exception(error_msg)

    except Exception as e:
        raise Exception(f"yt-dlp error: {str(e)}")

def main():
    logger.info("Starting download worker...")
    logger.info(f"Connecting to Redis: {os.getenv('REDIS_URL', 'redis://localhost:6379')}")

    # Test Redis connection
    try:
        redis_conn.ping()
        logger.info("✅ Redis connection successful")

        # Check if there are existing jobs in the queue
        queue_length = redis_conn.llen('download_queue')
        logger.info(f"📋 Current queue length: {queue_length}")

    except Exception as e:
        logger.error(f"❌ Redis connection failed: {e}")
        return

    while True:
        try:
            # Block and wait for a job from the queue
            logger.info("Waiting for jobs...")
            job_data = redis_conn.brpop('download_queue', timeout=5)

            if job_data:
                _, job_json = job_data
                logger.info(f"Received job: {job_json}")

                try:
                    # Parse job data
                    job = json.loads(job_json)

                    job_type = job.get("job_type", "download")
                    if job_type == "fix-duration":
                        result = fix_duration(job)
                    elif job_type == "analyze-local":
                        result = analyze_local_audio(job)
                    elif job_type == "extract-cover-art-album":
                        result = extract_embedded_cover_art_album(job)
                    elif job_type == "extract-cover-art":
                        result = extract_embedded_cover_art(job)
                    elif job.get("local_audio_url") and not has_download_urls(job):
                        logger.info(
                            "No remote URLs present for job %s; using local audio for full analysis",
                            job.get("job_id"),
                        )
                        result = analyze_local_audio(job)
                    else:
                        # Process the download
                        result = download_audio(job)
                    logger.info(f"Job {job.get('job_id')} completed with result: {result}")

                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse job JSON: {e}")
                except Exception as e:
                    logger.error(f"Job processing failed: {e}")
                    logger.error(traceback.format_exc())

        except redis.ConnectionError as e:
            logger.error(f"Redis connection error: {e}")
            time.sleep(5)  # Wait before retrying
        except KeyboardInterrupt:
            logger.info("Worker stopped by user")
            break
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            logger.error(traceback.format_exc())
            time.sleep(1)

if __name__ == '__main__':
    main()
