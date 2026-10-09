#!/bin/sh
# Reject an injected PostCSS config. Does not execute the file.
set -eu
MAX_BYTES=400
ROOT=$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)
FAILED=0

check_file() {
  file=$1
  if [ ! -f "$file" ]; then
    return 0
  fi
  bytes=$(wc -c < "$file" | tr -d ' ')
  if [ "$bytes" -gt "$MAX_BYTES" ]; then
    echo "BLOCKED: $file is $bytes bytes (limit $MAX_BYTES)." >&2
    FAILED=1
    return 0
  fi
  if grep -E -q 'createRequire|eval[[:space:]]*\(|child_process|Function[[:space:]]*\(|atob[[:space:]]*\(|spawn[[:space:]]*\(' "$file"; then
    echo "BLOCKED: $file contains a loader pattern that does not belong in PostCSS config." >&2
    FAILED=1
  fi
}

check_file "$ROOT/postcss.config.js"
check_file "$ROOT/postcss.config.mjs"
check_file "$ROOT/postcss.config.cjs"

if [ "$FAILED" -ne 0 ]; then
  echo "Do not run npm, npx, yarn, pnpm, bun, or next until this file is the short clean config." >&2
  exit 1
fi
echo "postcss config ok"
exit 0
