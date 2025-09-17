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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Redis connection
redis_conn = redis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379'))


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

def download_audio(job_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Download audio from various sources
    """
    track_id = job_data['track_id']
    friend_id = job_data['friend_id']
    job_id = job_data.get('job_id', f"{track_id}_{int(time.time())}")

    logger.info(f"Starting download job {job_id} for track {track_id}")
    logger.info(f"Job data: {job_data}")

    # Update status to processing
    update_job_status(job_id, 'processing', 10)

    try:
        # Prepare download parameters
        output_dir = "/app/audio"
        os.makedirs(output_dir, exist_ok=True)
        logger.info(f"Output directory: {output_dir}")

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
                        downloaded_file = download_with_gamdl(url, output_dir, track_id)
                    elif downloader == 'yt-dlp':
                        downloaded_file = download_with_ytdlp(url, output_dir, track_id)

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

        update_job_status(job_id, 'processing', 80)

        # Return success result
        result = {
            'success': True,
            'local_audio_url': downloaded_file,
            'track_id': track_id,
            'friend_id': friend_id
        }

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

def download_with_gamdl(url: str, output_dir: str, track_id: str) -> Optional[str]:
    """Download using gamdl (Apple Music downloader)"""
    try:
        # gamdl specific options
        cmd = [
            'gamdl',
            '--output-path', output_dir,
            '-o "%(track_id)s.%(ext)s"'
            # '--template', f'{track_id}',  # Use track_id as filename
            # '--quality', 'lossless',  # or 'high' for 256kbps
            # '--format', 'm4a',  # Apple's native format
        ]

        # Add cookies if specified and file exists
        cookie_file = os.getenv('GAMDL_COOKIE_FILE')
        if cookie_file and os.path.exists(cookie_file):
            cmd.extend(['-c', cookie_file])
            logger.info(f"Using cookie file: {cookie_file}")
        else:
            if cookie_file:
                logger.warning(f"Cookie file specified but not found: {cookie_file}")
            else:
                logger.info("No cookie file specified, proceeding without cookies")

        cmd.append(url)

        result = run_subprocess(cmd, timeout=300)

        if result.returncode != 0:
            raise Exception(f"gamdl failed: {result.stderr}")

        # Find the downloaded file - gamdl typically creates .m4a files
        for file in os.listdir(output_dir):
            if file.startswith(track_id) and (file.endswith('.m4a') or file.endswith('.mp3')):
                return os.path.join(output_dir, file)

        raise Exception("Downloaded file not found")

    except subprocess.TimeoutExpired:
        raise Exception("Download timeout (5 minutes)")
    except Exception as e:
        raise Exception(f"gamdl error: {str(e)}")

def download_with_ytdlp(url: str, output_dir: str, track_id: str) -> Optional[str]:
    """Download using yt-dlp"""
    try:
        output_template = f"{output_dir}/{track_id}.%(ext)s"

        cmd = [
            'yt-dlp',
            '-f bestaudio/best -x --audio-format m4a',
            # '--audio-format', 'mp3',
            # '--audio-quality', '320K',
            '--output', output_template,
            url
        ]

        result = run_subprocess(cmd, timeout=300)

        if result.returncode != 0:
            raise Exception(f"yt-dlp failed: {result.stderr}")

        # Find the downloaded file
        for file in os.listdir(output_dir):
            if file.startswith(track_id) and file.endswith('.mp3'):
                return os.path.join(output_dir, file)

        raise Exception("Downloaded file not found")

    except subprocess.TimeoutExpired:
        raise Exception("Download timeout (5 minutes)")
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