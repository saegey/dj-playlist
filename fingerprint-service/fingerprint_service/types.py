from typing import NotRequired, TypedDict

from groovenet_client.types import (
    FileStats as FileStats,
)
from groovenet_client.types import (
    FingerprintUpsert as FingerprintUpsert,
)
from groovenet_client.types import (
    IngestResult as IngestResult,
)
from groovenet_client.types import (
    MatchCandidate as MatchCandidate,
)
from groovenet_client.types import (
    SetResult as SetResult,
)
from groovenet_client.types import (
    WindowMatch as WindowMatch,
)


class IngestJob(TypedDict):
    """One `fingerprint_queue` payload, as the app enqueues it (#276).

    `ingest_id`, `source_id` and `file_path` are required; everything else is
    what the ingest route's ffprobe inspection happened to learn (#275) and may
    legitimately be absent.
    """

    ingest_id: str
    source_id: str
    file_path: str
    session_id: NotRequired[str | None]
    sequence: NotRequired[int | None]
    captured_at: NotRequired[str | None]
    duration_seconds: NotRequired[float | None]
    sample_rate: NotRequired[int | None]
    channels: NotRequired[int | None]
    codec: NotRequired[str | None]
    #: When the app pushed the job (#280), so queue wait can be logged.
    enqueued_at: NotRequired[str | None]


class SetJob(TypedDict):
    """One `fingerprint_set_queue` payload: derive a tracklist from a set (#282).

    `file_path` is relative to SET_RECORDINGS_DIR. Window and step default to
    #271's 15 s / 15 s and are carried back in the result, so a stored
    derivation always says how it was cut.
    """

    derivation_id: str
    file_path: str
    window_seconds: NotRequired[float | None]
    step_seconds: NotRequired[float | None]


class IndexJob(TypedDict):
    """One `fingerprint_index_queue` payload: fingerprint this reference track.

    The app resolves the candidate set and stamps each job with what it already
    holds for this track under the active engine — `stored_audio_sha256` is the
    hash of the file as it was when last indexed, or absent when there is no
    row. That is what lets the worker decide skip-or-regenerate from the bytes
    in front of it without a round-trip back to the app per track (#277).

    `run_id` names the progress counters; `force` is how `--all` says "index it
    even if nothing changed".
    """

    run_id: str
    track_id: str
    friend_id: int
    file_path: str
    fingerprint_type: str
    fingerprint_version: str
    stored_audio_sha256: NotRequired[str | None]
    # The file's size and mtime when fingerprinted (#303). When both match the
    # file on disk, the worker skips without hashing. Absent on older rows.
    stored_audio_size_bytes: NotRequired[int | None]
    stored_audio_mtime_ms: NotRequired[int | None]
    force: NotRequired[bool]


class IndexOutcome(TypedDict):
    """What became of one reference track.

    `indexed`, `skipped` and `failed` are three of the four counters the run
    summary reports; the fourth — unindexable — is counted by the app at resolve
    time, because a track with no `local_audio_url` never reaches the queue.
    """

    run_id: str
    track_id: str
    friend_id: int
    status: str
    error: str | None
    audio_sha256: str | None
