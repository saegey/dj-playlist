#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<USAGE
Usage: $0 --restore-target <path> [options]

Required:
  --restore-target PATH   Restic restore target directory (from: restic restore ... --target PATH)

Optional:
  --music-volume NAME     Docker volume for /app/audio (default: teststack_music_data)
  --covers-volume NAME    Docker volume for /app/public/uploads/album-covers (default: teststack_album_covers)
  --dumps-volume NAME     Docker volume for /app/dumps (default: teststack_db_dumps)
  --dry-run               Print planned actions only

Examples:
  $0 --restore-target /tmp/restore
  $0 --restore-target /tmp/restore --dry-run
  $0 --restore-target /tmp/restore --music-volume my_music_volume
USAGE
}

RESTORE_TARGET=""
MUSIC_VOLUME="${MUSIC_VOLUME:-teststack_music_data}"
COVERS_VOLUME="${COVERS_VOLUME:-teststack_album_covers}"
DUMPS_VOLUME="${DUMPS_VOLUME:-teststack_db_dumps}"
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --restore-target)
      RESTORE_TARGET="${2:-}"
      shift 2
      ;;
    --music-volume)
      MUSIC_VOLUME="${2:-}"
      shift 2
      ;;
    --covers-volume)
      COVERS_VOLUME="${2:-}"
      shift 2
      ;;
    --dumps-volume)
      DUMPS_VOLUME="${2:-}"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1"
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$RESTORE_TARGET" ]]; then
  echo "Error: --restore-target is required"
  usage
  exit 1
fi

if [[ ! -d "$RESTORE_TARGET" ]]; then
  echo "Error: restore target directory not found: $RESTORE_TARGET"
  exit 1
fi

resolve_dir() {
  local base="$1"
  shift
  for rel in "$@"; do
    if [[ -d "$base/$rel" ]]; then
      echo "$base/$rel"
      return 0
    fi
  done
  return 1
}

copy_dir_contents_to_volume() {
  local src_dir="$1"
  local volume_name="$2"
  local label="$3"

  if [[ "$DRY_RUN" == true ]]; then
    echo "[dry-run] Copy $label"
    echo "          from: $src_dir"
    echo "          to volume: $volume_name"
    return 0
  fi

  docker volume inspect "$volume_name" >/dev/null

  docker run --rm \
    -v "$volume_name:/dest" \
    -v "$src_dir:/src:ro" \
    alpine:3.20 \
    sh -lc 'mkdir -p /dest && cp -a /src/. /dest/'

  echo "Copied $label -> $volume_name"
}

AUDIO_SRC=""
COVERS_SRC=""
DUMPS_SRC=""

if AUDIO_SRC="$(resolve_dir "$RESTORE_TARGET" app/audio audio 2>/dev/null)"; then
  :
fi
if COVERS_SRC="$(resolve_dir "$RESTORE_TARGET" app/public/uploads/album-covers public/uploads/album-covers 2>/dev/null)"; then
  :
fi
if DUMPS_SRC="$(resolve_dir "$RESTORE_TARGET" app/dumps dumps 2>/dev/null)"; then
  :
fi

echo "Restore target: $RESTORE_TARGET"
echo "Music volume : $MUSIC_VOLUME"
echo "Covers volume: $COVERS_VOLUME"
echo "Dumps volume : $DUMPS_VOLUME"

if [[ -n "$AUDIO_SRC" ]]; then
  copy_dir_contents_to_volume "$AUDIO_SRC" "$MUSIC_VOLUME" "audio files"
else
  echo "Skip audio: no source folder found under restore target"
fi

if [[ -n "$COVERS_SRC" ]]; then
  copy_dir_contents_to_volume "$COVERS_SRC" "$COVERS_VOLUME" "album covers"
else
  echo "Skip covers: no source folder found under restore target"
fi

if [[ -n "$DUMPS_SRC" ]]; then
  copy_dir_contents_to_volume "$DUMPS_SRC" "$DUMPS_VOLUME" "database dumps"
else
  echo "Skip dumps: no source folder found under restore target"
fi

echo "Done."
