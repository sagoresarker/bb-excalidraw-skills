#!/usr/bin/env bash
# render.sh — lint + render one spec into <outdir>/<name>.{svg,excalidraw,png}
#
#   scripts/render.sh path/to/spec.(js|json) [outdir]     (outdir defaults to the spec's folder)
#   SKIP_LINT=1 scripts/render.sh ...                      render even if lint reports errors
#   CHROME=/path/to/chrome scripts/render.sh ...           override browser for the PNG preview
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
spec="${1:?usage: render.sh spec.(js|json) [outdir]}"
[ -f "$spec" ] || { echo "no such spec: $spec" >&2; exit 2; }
spec="$(cd "$(dirname "$spec")" && pwd)/$(basename "$spec")"
name="$(basename "$spec")"; name="${name%.*}"
outdir="${2:-$(dirname "$spec")}"; mkdir -p "$outdir"; outdir="$(cd "$outdir" && pwd)"
base="$outdir/$name"

[ -d "$HERE/../node_modules/roughjs" ] || { echo "dependencies missing: run 'npm i' in $(cd "$HERE/.." && pwd)" >&2; exit 2; }

if [ "${SKIP_LINT:-0}" != "1" ]; then
  node "$HERE/lint.js" "$spec" || { echo "lint failed: fix the errors above (or SKIP_LINT=1 to render anyway)" >&2; exit 1; }
fi

node "$HERE/bbdiagram.js" "$spec" "$base" >/dev/null
read -r W H < <(node -e 'const {loadSpec}=require(process.argv[1]);const s=loadSpec(process.argv[2]);console.log(s.width,s.height)' "$HERE/bbdiagram.js" "$spec")

chrome="${CHROME:-}"
if [ -z "$chrome" ]; then
  for c in "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
           "/Applications/Chromium.app/Contents/MacOS/Chromium" \
           "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" \
           google-chrome google-chrome-stable chromium chromium-browser; do
    if [ -x "$c" ] || command -v "$c" >/dev/null 2>&1; then chrome="$c"; break; fi
  done
fi

if [ -n "$chrome" ]; then
  profile="$(mktemp -d)"
  "$chrome" --headless=new --no-sandbox --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
    --user-data-dir="$profile" --window-size="$W,$H" --screenshot="$base.png" "file://$base.svg" >/dev/null 2>&1 &
  pid=$!
  ( sleep 60; kill "$pid" 2>/dev/null ) & watcher=$!   # portable timeout (macOS has no GNU timeout)
  wait "$pid" 2>/dev/null || true
  { kill "$watcher" && wait "$watcher"; } 2>/dev/null || true
  rm -rf "$profile"
  [ -s "$base.png" ] || echo "warn: PNG screenshot failed (svg + excalidraw are fine)" >&2
else
  echo "warn: no Chrome/Chromium found; skipped PNG (set CHROME=/path/to/browser)" >&2
fi

echo "ok $name ${W}x${H}"
for ext in svg excalidraw png; do [ -f "$base.$ext" ] && echo "  $base.$ext"; done
exit 0
