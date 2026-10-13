#!/usr/bin/env bash
# usage: ./render_all.sh  -> renders every specs/*.js into render/<name>.{svg,excalidraw,png}
set -e
cd "$(dirname "$0")"
for spec in specs/*.js; do
  name=$(basename "$spec" .js)
  node lib/bbdiagram.js "$spec" "render/$name" >/dev/null
  read W H < <(node -e "const s=require('./$spec');console.log(s.width,s.height)")
  timeout 60 google-chrome --headless=new --no-sandbox --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
    --window-size=$W,$H --screenshot="render/$name.png" "file://$PWD/render/$name.svg" >/dev/null 2>&1
  echo "ok $name ${W}x${H}"
done
