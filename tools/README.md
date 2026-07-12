# Adding new content to the site

All cards, side projects, and posters are driven by [`js/site-data.js`](../js/site-data.js).
Read the comment block at the top of that file first — it has copy-paste
templates for all three types. Short version:

## A new UI/UX case study (PDF-backed)

1. Rasterize the PDF into the screens the in-page viewer shows:
   ```
   pip install --user pymupdf pillow   # once
   python3 tools/add_case_study.py path/to/yours.pdf your-slug --layout deck
   ```
   Use `--layout page` instead for a tall single-page site mockup (it gets
   sliced into a seamless scroll rather than separate framed slides).

   This copies the PDF into `assets/pdfs/`, renders each page to WebP into
   `assets/cases/your-slug/`, and writes the result into `js/cases-data.js`
   (auto-generated — don't hand-edit that file). It also auto-detects an
   embedded Figma/Framer/InVision prototype link if the PDF has one.

2. The script prints a ready-to-paste object for `js/site-data.js` — copy it
   into the `work` array, fill in the `TODO`s (title, tags, one-line blurb,
   and a thumbnail image path under `assets/work/`).

## A new vibe-coded / live-link project

No script. Add an object to the `vibe` array in `js/site-data.js` — see the
template in that file's header comment.

## A new poster / logo for the Craft Wall

Drop the image in `assets/gallery/`, then add one object to the `posters`
array in `js/site-data.js`. `row` is optional — omit it and it's balanced
across the three marquee rows automatically.

---
Nothing else needs to change — `js/main.js` renders all three sections from
this data at page load.
