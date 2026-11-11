#!/usr/bin/env python3
"""Cut case-study figures out of the original PDF decks.

Reads content/case-figure-cuts/<slug>.json:
  { "pdf": "assets/pdfs/<file>.pdf",
    "cuts": [ {"name": "chat", "page": 13, "box": [x0, y0, x1, y1], "width": 640}, ... ] }
Optional "blank": [[x0, y0, x1, y1], ...] paints parts of the cut white (fractions of the cut).
`box` is in fractions of the page (0 to 1), so it survives a change of render size. Each cut is
rendered sharp from the PDF (not from the page tiles) and written to assets/cases/<slug>/<name>.webp.
Run:  python3 tools/cut_case_figures.py [slug ...]     (no slug = every deck in the file)
Prints "slug/name widthxheight" for each file so the sizes can go into the case-study content.
"""
import json, sys, os
sys.path.append(os.path.expanduser('~/Library/Python/3.9/lib/python/site-packages'))
import fitz  # PyMuPDF
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPECS = os.path.join(ROOT, 'content', 'case-figure-cuts')  # one file per deck, so two people never edit the same one
wanted = sys.argv[1:] or sorted(f[:-5] for f in os.listdir(SPECS) if f.endswith('.json'))
spec = {slug: json.load(open(os.path.join(SPECS, slug + '.json'), encoding='utf-8')) for slug in wanted}
for slug in wanted:
    deck = spec[slug]
    doc = fitz.open(os.path.join(ROOT, deck['pdf']))
    out_dir = os.path.join(ROOT, 'assets', 'cases', slug)
    os.makedirs(out_dir, exist_ok=True)
    for cut in deck['cuts']:
        page = doc[cut['page'] - 1]
        x0, y0, x1, y1 = cut.get('box', [0, 0, 1, 1])
        rect = page.rect
        clip = fitz.Rect(rect.x0 + x0 * rect.width, rect.y0 + y0 * rect.height, rect.x0 + x1 * rect.width, rect.y0 + y1 * rect.height)
        width = cut.get('width', 1400)
        zoom = min(6.0, max(1.0, 1.6 * width / clip.width))  # render above the target, then scale down
        pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), clip=clip, alpha=False)
        image = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
        height = round(image.height * width / image.width)
        image = image.resize((width, height), Image.LANCZOS)
        for bx0, by0, bx1, by1 in cut.get('blank', []):  # paint out stray slide text caught in the crop
            image.paste((255, 255, 255), (round(bx0 * width), round(by0 * height), round(bx1 * width), round(by1 * height)))
        path = os.path.join(out_dir, cut['name'] + '.webp')
        image.save(path, 'WEBP', quality=cut.get('quality', 86), method=6)
        print(f"{slug}/{cut['name']} {width}x{height} {os.path.getsize(path)//1024}KB")
