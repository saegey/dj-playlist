#!/usr/bin/env bash
set -euo pipefail

USER_CONFIG_DIR="${HOME}/.config/caddy"
BREW_PREFIX="/opt/homebrew"
CONFIG_DIR="${BREW_PREFIX}/etc"
WORKTREE_DIR="${USER_CONFIG_DIR}/worktrees"
CADDYFILE="${CONFIG_DIR}/Caddyfile"
BACKUP_SUFFIX="$(date -u +%Y%m%dT%H%M%SZ)"

usage() {
  cat <<EOF
Usage: $(basename "$0") [--force]

Installs and configures a host-level Caddy daemon for local worktree HTTPS.

Behavior:
- installs Caddy with Homebrew if needed
- creates ~/.config/caddy/worktrees
- writes a base Caddyfile at /opt/homebrew/etc/Caddyfile
- starts or restarts the Homebrew caddy service
- runs 'sudo caddy trust' for local TLS

If /opt/homebrew/etc/Caddyfile already exists and does not match the managed
worktree config, the script will stop unless --force is provided.
EOF
}

FORCE=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --)
      shift
      continue
      ;;
    --force)
      FORCE=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Required command not found: $1" >&2
    exit 1
  }
}

require_command brew

if ! command -v caddy >/dev/null 2>&1; then
  echo "Installing Caddy with Homebrew"
  brew install caddy
fi

mkdir -p "$WORKTREE_DIR" "$CONFIG_DIR"

managed_caddyfile="$(mktemp)"
cat >"$managed_caddyfile" <<'EOF'
{
  auto_https disable_redirects
}

EOF

cat >>"$managed_caddyfile" <<EOF
import ${WORKTREE_DIR}/*.caddy
EOF

if [[ -f "$CADDYFILE" ]]; then
  if ! cmp -s "$managed_caddyfile" "$CADDYFILE"; then
    if [[ "$FORCE" != true ]]; then
      echo "Existing Caddyfile found at $CADDYFILE and it is not the managed worktree config." >&2
      echo "Re-run with --force to back it up and replace it." >&2
      rm -f "$managed_caddyfile"
      exit 1
    fi
    backup_path="${CADDYFILE}.bak.${BACKUP_SUFFIX}"
    cp "$CADDYFILE" "$backup_path"
    echo "Backed up existing Caddyfile to $backup_path"
  fi
fi

mv "$managed_caddyfile" "$CADDYFILE"
echo "Wrote $CADDYFILE"

echo "Formatting and validating Caddy config"
caddy fmt --overwrite "$CADDYFILE" >/dev/null
caddy validate --config "$CADDYFILE"

if brew services list | grep -q '^caddy[[:space:]]'; then
  echo "Restarting Homebrew caddy service"
  brew services restart caddy
else
  echo "Starting Homebrew caddy service"
  brew services start caddy
fi

echo "Trusting Caddy local CA"
sudo caddy trust --config "$CADDYFILE"

echo
echo "Caddy host install complete"
echo "  Caddyfile: $CADDYFILE"
echo "  Worktree fragments: $WORKTREE_DIR"
echo "  Service: brew services"
