#!/bin/sh
# Restore a short PostCSS config if a checkout or merge drops in an injected one.
set -eu
ROOT=$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)
CHECK="$ROOT/scripts/security/check-postcss.sh"
MODE=${1:-check}

restore_clean() {
  if ! "$CHECK"; then
    cat > "$ROOT/postcss.config.js" <<'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
EOF
    echo "Restored clean postcss.config.js. Do not run npm or next until this stays clean." >&2
    "$CHECK"
  fi
}

case "$MODE" in
  check|pre-commit|pre-push)
    "$CHECK"
    ;;
  post-checkout|post-merge)
    restore_clean
    ;;
  *)
    echo "Unknown hook mode: $MODE" >&2
    exit 1
    ;;
esac
