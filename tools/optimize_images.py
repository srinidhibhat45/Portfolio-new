#!/usr/bin/env python3
"""
Generate WebP derivatives for every image the homepage loads.

Why two sizes for the gallery: the Craft Wall marquee never shows a poster
taller than 260 CSS px, but clicking one opens it in the lightbox at up to
88vh. Shipping one 900px file for both meant the marquee downloaded ~3.3MB of
detail it could never show. So each poster gets a small `-t.webp` for the wall
and a full-size `.webp` that the lightbox swaps in on demand.

Idempotent — safe to re-run after dropping new files into assets/. Existing
derivatives are only rewritten when the source is newer.

    python3 tools/optimize_images.py [--force]
"""

import os
import subprocess
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
FORCE = "--force" in sys.argv

# (directory, max longest edge for the full webp, max height for -t thumb)
# thumb = None means no separate thumbnail is generated.
JOBS = [
    ("assets/work", 1000, None),      # cards render ~540px wide, 1000 covers 2x
    ("assets/gallery", 900, 520),     # wall shows <=260px tall, lightbox wants 900
    ("assets/img", None, None),       # hero/portrait, handled by SPECIAL below
]

# Images in assets/img that the page actually loads, with their target width.
# Anything not listed is a favicon, an OG image, or an unused source file.
SPECIAL = {
    "hero.png": 846,              # renders <=460px wide, 2x
    "about-portrait.png": 880,    # renders <=440px wide, 2x
    "testimonial-kanika.png": 296,
    "testimonial-gurudath.png": 296,
}

QUALITY = 82


def encode(src: Path, dst: Path, max_edge=None, max_height=None) -> bool:
    """Write a WebP derivative of src. Returns True if it (re)wrote the file."""
    if dst.exists() and not FORCE and dst.stat().st_mtime >= src.stat().st_mtime:
        return False

    im = Image.open(src)
    if max_height and im.height > max_height:
        w = round(im.width * max_height / im.height)
        im = im.resize((w, max_height), Image.LANCZOS)
    elif max_edge and max(im.size) > max_edge:
        scale = max_edge / max(im.size)
        im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)

    # cwebp beats Pillow's encoder noticeably at the same visual quality, so
    # round-trip through a temporary PNG when it's on the box.
    if _CWEBP:
        tmp = dst.with_suffix(".tmp.png")
        im.save(tmp)
        subprocess.run(
            [_CWEBP, "-quiet", "-q", str(QUALITY), "-m", "6", str(tmp), "-o", str(dst)],
            check=True,
        )
        tmp.unlink()
    else:
        im.save(dst, "WEBP", quality=QUALITY, method=6)
    return True


def _which(name):
    from shutil import which
    return which(name)


_CWEBP = _which("cwebp")


def main():
    before = after = 0
    written = 0

    for rel, max_edge, thumb_h in JOBS:
        d = ROOT / rel
        if not d.is_dir():
            continue
        for src in sorted(d.iterdir()):
            if src.suffix.lower() not in (".png", ".jpg", ".jpeg"):
                continue

            if rel == "assets/img":
                if src.name not in SPECIAL:
                    continue
                max_edge, thumb_h = SPECIAL[src.name], None

            out = src.with_suffix(".webp")
            if encode(src, out, max_edge=max_edge):
                written += 1
            before += src.stat().st_size
            after += out.stat().st_size

            if thumb_h:
                t = src.with_name(src.stem + "-t.webp")
                if encode(src, t, max_height=thumb_h):
                    written += 1
                after += t.stat().st_size

    print(f"encoder: {'cwebp' if _CWEBP else 'Pillow'}   files written: {written}")
    print(f"originals: {before/1024/1024:.2f} MB  ->  webp: {after/1024/1024:.2f} MB "
          f"({100 - after * 100 / before:.0f}% smaller)")


if __name__ == "__main__":
    main()
