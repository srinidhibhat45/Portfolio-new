#!/bin/sh
# Converts every finished cover PNG into the two WebP sizes the site uses:
# <slug>.webp at 1280px wide (2x of the largest card) and <slug>-800.webp for small screens.
# Usage: convert.sh <dir with final PNGs> <project assets/covers dir>
src="$1"; out="$2"; mkdir -p "$out"; n=0
for f in "$src"/*.png; do
  slug=$(basename "$f" .png)
  cwebp -quiet -q 82 -m 6 -resize 1280 0 "$f" -o "$out/$slug.webp" && cwebp -quiet -q 80 -m 6 -resize 800 0 "$f" -o "$out/$slug-800.webp" && n=$((n+1))
done
echo "$n covers converted"
