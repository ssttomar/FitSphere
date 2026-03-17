#!/bin/bash
# Run this script once after installing ffmpeg to compress and optimize hero videos for web.
# Install ffmpeg: https://ffmpeg.org/download.html (or: winget install ffmpeg)

INPUT_DIR="public/videos"
OUTPUT_DIR="public/videos/optimized"
mkdir -p "$OUTPUT_DIR"

for i in 1 2; do
  IN="$INPUT_DIR/hero${i}.mp4"
  OUT="$OUTPUT_DIR/hero${i}.mp4"
  WEBM="$OUTPUT_DIR/hero${i}.webm"

  echo "Processing hero${i}.mp4 ..."

  # H.264 MP4 — highest compat, good quality at low bitrate
  ffmpeg -y -i "$IN" \
    -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:-1:-1:color=black" \
    -c:v libx264 -preset slow -crf 22 \
    -profile:v high -level 4.1 \
    -movflags +faststart \
    -an \
    "$OUT"

  # WebM VP9 — smaller size, better for modern browsers
  ffmpeg -y -i "$IN" \
    -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:-1:-1:color=black" \
    -c:v libvpx-vp9 -crf 28 -b:v 0 \
    -deadline best -cpu-used 0 \
    -an \
    "$WEBM"

  echo "Done: $OUT + $WEBM"
done

echo ""
echo "Optimized videos saved to $OUTPUT_DIR"
echo "Update src in hero-section.tsx to use /videos/optimized/hero1.mp4 etc."
