# Indian textile direction — 9 October 2026

The initial SVG illustration treatment was replaced with generated raster artwork after visual review. The first pass is documented in [generated-textile-art.md](generated-textile-art.md); current refinements, placements, exact prompts and verification are in [motif-texture-refinement.md](motif-texture-refinement.md). The clothing references that informed the broader direction were:

- [MyDesignation, Pride of India](https://www.mydesignation.com/collections/pride-of-india), including the Karigar shirt's geometric borders and folk-print panels.
- [The Souled Store, printed shirts](https://api.thesouledstore.com/tags/printed-shirts).

These are contemporary interpretations inspired by textile forms, not reproductions of brand artwork or claims of authentic traditional craft.

## Current composition

- Portrait: a detailed jaali-inspired medallion, slowly rotating behind the photograph.
- Hero, timeline, and board: broad Ajrakh print impressions that dissolve at the outer margins.
- Project and services margins: soft Ajrakh-inspired print accents, with rounded fading masks and no ribbons.
- About: a complete Pichwai-inspired lotus garden. Contact and menu: refined brocade paisleys, clear of the reading area.
- Brain: subtle cotton-paper texture with no decorative hem around the interactive connections.
- Writing room: two botanical parakeets in their own desktop column beside the notebook.

All large artwork is contained and hidden from assistive technology. The hero edges are left clear on phones; the portrait ornament carries the theme. Narrow woven hems have been removed throughout.

## Motion and earlier-pass verification

Panels enter once with a gentle fade and translation, then move only a few pixels. Continuous movement pauses off-screen and when the tab is hidden. Reduced-motion preferences disable movement; static audit mode pauses the new panel and portrait animation. The existing artwork marquee and its pause/grid controls are preserved.

- Five original images were generated; six optimized WebP assets including a rotated border derivative total approximately 1.2 MB.
- Build, JavaScript syntax checks and all 34 existing regression tests passed.
- No horizontal page overflow at 1280×720, 393×694 or 320×568.
- Full mobile portrait remains visible: its bottom is approximately 487 px at 393×694, and 429 px at 320×568.
- Axe scans: zero detected violations in desktop and mobile light/dark themes. Automated contrast checks have incomplete results for patterned/pseudo-element backgrounds, so visual readability was also reviewed. This is not a complete accessibility certification.
- Existing project data, game persistence and the four local visitor marks remain unchanged.
