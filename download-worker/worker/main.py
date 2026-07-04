import json
import time
import traceback

import redis

from .config import logger, redis_conn
from .jobs.analyze import analyze_local_audio
from .jobs.cover_art import extract_embedded_cover_art, extract_embedded_cover_art_album
from .jobs.download import download_audio, has_download_urls
from .jobs.duration import fix_duration


def main() -> None:
    logger.info("Starting download worker...")
    logger.info(f"Connecting to Redis: {redis_conn.connection_pool.connection_kwargs}")

    try:
        redis_conn.ping()
        logger.info("Redis connection successful")
        queue_length = redis_conn.llen('download_queue')
        logger.info(f"Current queue length: {queue_length}")
    except Exception as e:
        logger.error(f"Redis connection failed: {e}")
        return

    while True:
        try:
            logger.info("Waiting for jobs...")
            job_data = redis_conn.brpop('download_queue', timeout=5)

            if job_data:
                _, job_json = job_data
                logger.info(f"Received job: {job_json}")

                try:
                    job = json.loads(job_json)
                    job_type = str(job.get("job_type", "download")).strip().lower()

                    if job_type in ("fix-duration", "fix_duration"):
                        result = fix_duration(job)
                    elif job_type in ("analyze-local", "analyze_local"):
                        result = analyze_local_audio(job)
                    elif job_type in ("extract-cover-art-album", "extract_cover_art_album"):
                        result = extract_embedded_cover_art_album(job)
                    elif job_type in ("extract-cover-art", "extract_cover_art"):
                        result = extract_embedded_cover_art(job)
                    elif job.get("local_audio_url") and not has_download_urls(job):
                        logger.info(
                            "No remote URLs for job %s; using local audio analysis",
                            job.get("job_id"),
                        )
                        result = analyze_local_audio(job)
                    else:
                        result = download_audio(job)

                    logger.info(f"Job {job.get('job_id')} completed with result: {result}")

                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse job JSON: {e}")
                except Exception as e:
                    logger.error(f"Job processing failed: {e}")
                    logger.error(traceback.format_exc())

        except redis.ConnectionError as e:
            logger.error(f"Redis connection error: {e}")
            time.sleep(5)
        except KeyboardInterrupt:
            logger.info("Worker stopped by user")
            break
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            logger.error(traceback.format_exc())
            time.sleep(1)


if __name__ == "__main__":
    main()
