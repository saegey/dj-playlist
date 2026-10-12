"""Key extraction from Essentia's `tonal` output (#524).

MusicExtractor computes key three independent ways -- key_krumhansl,
key_temperley and key_edma -- each `{key, scale, strength}`, plus a fourth,
differently derived estimate from chord detection (`chords_key`/
`chords_scale`, flat strings with no strength). Only key_edma (tuned for
electronic/dance music) is stored; its strength (0-1 confidence) travels
alongside it instead of being discarded, and a disagreement against any of
the other three is logged rather than silently dropped. The TypeScript twin
of this module is `my-collection-search/src/lib/essentiaKey.ts`.
"""

from typing import Any

from .config import logger


def _format_key(estimate: dict[str, Any] | None) -> str | None:
    if not estimate or not estimate.get('key') or not estimate.get('scale'):
        return None
    return f"{estimate['key']} {estimate['scale']}"


def extract_key_analysis(tonal: dict[str, Any] | None) -> tuple[str | None, float | None]:
    """The value stored as `key`/`key_confidence`: EDMA's key and strength."""
    tonal = tonal or {}
    edma = tonal.get('key_edma') or {}
    strength = edma.get('strength')
    key_confidence = round(strength, 3) if isinstance(strength, (int, float)) else None
    return _format_key(edma), key_confidence


def _format_chords_key(tonal: dict[str, Any]) -> str | None:
    key = tonal.get('chords_key')
    scale = tonal.get('chords_scale')
    if not key or not scale:
        return None
    return f"{key} {scale}"


def log_key_profile_disagreement(tonal: dict[str, Any] | None, track_id: str, friend_id: int) -> None:
    """Logs (never raises) when another key estimate disagrees with the
    stored EDMA estimate. On the track that prompted #524, the three key
    profiles (edma/krumhansl/temperley) all agreed with each other -- the
    actual F-major/C-major split was against `chords_key`, a differently
    derived estimate from chord detection rather than a key profile. Checks
    every independent estimate Essentia computed, not just the three
    profiles, so a disagreement like that one isn't missed again."""
    tonal = tonal or {}
    edma = _format_key(tonal.get('key_edma'))
    if not edma:
        return

    disagreements = []
    krumhansl = _format_key(tonal.get('key_krumhansl'))
    temperley = _format_key(tonal.get('key_temperley'))
    chords = _format_chords_key(tonal)
    if krumhansl and krumhansl != edma:
        disagreements.append(f"krumhansl={krumhansl}")
    if temperley and temperley != edma:
        disagreements.append(f"temperley={temperley}")
    if chords and chords != edma:
        disagreements.append(f"chords={chords}")

    if disagreements:
        logger.warning(
            "Key profile disagreement for track %s (friend %s): stored edma=%s vs %s",
            track_id,
            friend_id,
            edma,
            ", ".join(disagreements),
        )
