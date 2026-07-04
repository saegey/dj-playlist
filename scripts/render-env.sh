#!/usr/bin/env bash
set -euo pipefail

TEMPLATE_PATH="${1:-.env.tpl}"
OUTPUT_PATH="${2:-}"

if [[ -z "${OUTPUT_PATH}" ]]; then
  echo "Usage: $0 <template-path> <output-path>" >&2
  exit 1
fi

if ! command -v op >/dev/null 2>&1; then
  echo "ERROR: 1Password CLI 'op' is required to render ${TEMPLATE_PATH}" >&2
  exit 1
fi

tmp_raw="$(mktemp)"
cleanup() {
  rm -f "${tmp_raw}"
}
trap cleanup EXIT

op inject -i "${TEMPLATE_PATH}" -o "${tmp_raw}"

awk '
  BEGIN {
    key = "APPLE_MUSIC_PRIVATE_KEY="
    capture = 0
    pem = ""
  }

  capture {
    pem = pem "\\n" $0
    if ($0 ~ /-----END .*PRIVATE KEY-----/) {
      print key pem
      capture = 0
      pem = ""
    }
    next
  }

  index($0, key) == 1 {
    value = substr($0, length(key) + 1)
    if (value ~ /-----BEGIN .*PRIVATE KEY-----/ && value !~ /\\n/ && value !~ /-----END .*PRIVATE KEY-----/) {
      capture = 1
      pem = value
      next
    }
  }

  { print }

  END {
    if (capture) {
      print key pem
    }
  }
' "${tmp_raw}" > "${OUTPUT_PATH}"
