#!/usr/bin/env bash
# Trims and encodes the landing video recorded by capture.spec.ts, and makes its poster.
# Needs ffmpeg (brew install ffmpeg). Run from apps/web: scripts/landing-media/process.sh
set -euo pipefail

RAW=test-results/landing-media/raw
OUT=public/landing
mkdir -p "$OUT"

start=$(python3 -c "import json; print(json.load(open('$RAW/clip.json'))['start'])")
end=$(python3 -c "import json; print(json.load(open('$RAW/clip.json'))['end'])")

# MP4 (H.264) for every browser, WebM (VP9) as a lighter alternative. No sound.
ffmpeg -y -loglevel error -ss "$start" -to "$end" -i "$RAW/hero-raw.webm" \
  -an -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart "$OUT/hero.mp4"
ffmpeg -y -loglevel error -ss "$start" -to "$end" -i "$RAW/hero-raw.webm" \
  -an -c:v libvpx-vp9 -b:v 0 -crf 36 -row-mt 1 "$OUT/hero.webm"
# Poster: the first frame (also what "Reduce motion" shows).
ffmpeg -y -loglevel error -i "$OUT/hero.mp4" -frames:v 1 -q:v 3 "$OUT/hero-poster.jpg"

ls -lh "$OUT"/hero.*  "$OUT"/hero-poster.jpg
