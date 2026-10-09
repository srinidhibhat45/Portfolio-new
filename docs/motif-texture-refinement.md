# Motif and texture refinement — 9 October 2026

Generated using the built-in image-generation tool. PNG masters are stored locally under ignored `assets/_src/textiles/`; optimized delivery WebPs preserve alpha.

## Saved assets and placement

- `assets/img/textiles/portrait-filigree-v2.webp`: more open ornamental portrait medallion, also used at restrained opacity in game surfaces.
- `assets/img/textiles/pichwai-lotus-garden.webp`: complete lotus garden in the about section and a quiet decoration in an empty corner of the visitor canvas.
- `assets/img/textiles/blockprint-seal.webp`: compact seal for menu hover, services, timeline ornaments, game launcher/results, card backs, and the music record label.
- `assets/img/textiles/cotton-paper-texture.webp`: low-strength tactile paper across hero, projects, about, experience, services, brain, writing, testimonials, contact and the visitor canvas. Lower contrast in dark mode.

The existing paisley and parakeet illustrations remain. Thin decorative ribbons remain removed. Large illustrations stay clear of text; functional UI icons stay legible. All generated art is decorative and excluded from accessible names.

## Visitor canvas

Fit is the initial camera mode on every device. The phone-specific 65% zoom override is removed. Fit adapts to width and height changes; manual zoom and pan clear Fit and preserve the visitor's chosen camera centre when the viewport resizes. The Fit button communicates its active state. The canvas stays hidden until its first camera placement, preventing an initial full-size flash. Sticker and stamp hit areas stay at least 26 screen pixels at low zoom. Notes, sticker placement, and shared visitor data are unchanged.

## Final generation prompts

### portrait-filigree-v2

Use case: stylized-concept. Asset type: transparent Indian geometric medallion for slow rotation behind a portrait on a refined personal portfolio. ONE circular symmetrical ornamental medallion, fully visible with generous transparent margins. Flat matte print artwork, exceptionally clean professional textile illustration. Fine architectural jaali lattice, concentric carved scalloped arches, balanced eight-point stars and delicate miniature paisley seeds; intricate expert linework with airy open transparent gaps. Elegant antique muted gold and warm sand, a few restrained dusty burgundy and indigo accents. Much more negative space than solid ink. Precise geometry, distinct nested bands, consistent fine line weights. No generic flower mandala, no thick outlines, no gold jewellery or shiny 3D object, no shadows, no paper disk, no fabric photo, no background, no text or logo. Genuinely transparent background, square composition, nothing cropped.

### pichwai-lotus-garden

Use case: stylized-concept. Asset type: transparent ornamental botanical artwork for softly faded website margins. An exquisite original Pichwai-inspired lotus garden: five graceful lotus blooms and buds on naturally curving stems with broad articulated lotus leaves, an elegant airy arrangement. Wide landscape composition, all plants completely visible with transparent margin around every side, no border or frame. Sophisticated professional pen-painted Indian textile illustration, finely detailed yet cleanly filled flat shapes; natural botanical proportions, delicate veins, controlled matte pigment texture, no childish outlines. Muted sage and deep olive leaves, faded wine and dusty terracotta petals, restrained antique gold detailing. Abundant open transparent space between stems. Museum-quality calm royal character, no birds, no people, no text, no branding, no 3D, no glitter, no paper or solid ground. Genuine transparent background.

### blockprint-seal

Use case: stylized-concept. Asset type: small transparent ornamental seal used at 28 to 48 pixels in website navigation, timeline, music and games. ONE perfectly centred, simple clean eight-point Indian block-print star seal with restrained ornamental detail. Bold beautiful silhouette formed by two interlaced stepped diamonds, a small lotus seed centre, eight separated leaf-like accent shapes. Elegant flat printed mark in matte antique gold, dark burgundy and muted sage, with generous clear gaps so the pattern stays recognisable at tiny sizes. Crisp professional symmetry and balanced line weights, no intricate micro-patterns, no large frame. Quiet premium Indian textile character. Square image, complete mark with 15 percent empty transparent margin on all sides. No text, logo, watermark, paper, background rectangle, shadow or shiny 3D. Genuine transparent background.

### cotton-paper-texture

Use case: texture. Asset type: subtle full-bleed cotton rag paper and khadi surface for backgrounds on a refined Indian personal portfolio. A completely flat, front-facing close view of warm ivory handmade cotton paper with extraordinarily fine irregular fibres and a faint soft woven grain. Quiet tactile material, even exposure, very low contrast, almost unmarked pale ivory, cream and sand only. Sophisticated editorial background that will sit underneath readable text. Entire square evenly filled, visually uniform from edge to edge, repeat-friendly with no visible borders. No motifs, stripes, flowers, stains, speckles, dark fibres, creases, folds, shadows, gradient, vignette, perspective, objects, text or watermark. The tiny fibre detail should be delicate rather than noisy, luxurious archival paper.


## Verification

- JavaScript syntax check, production build, and all 34 regression tests passed.
- Fit contains the whole 1400 × 900 world at 1280 × 720, 393 × 694 and 320 × 568. Zoom clears Fit; resize preserves a manually chosen zoom; Fit restores the complete canvas.
- Desktop light/dark Axe scans detected zero violations. Actual 393 px phone scans found one target-size warning for a starter sparkle partly overlapped by an existing visitor sticker. Targets now scale to at least 26 screen pixels; overlapping marks retain their saved positions. Zoom and keyboard selection remain available. Patterned/pseudo-element backgrounds also require manual contrast review. This is not a complete accessibility certification.
- Phone menu and game ornaments were visually reviewed. Generated illustrations keep transparent edges and do not intercept pointer input. The continuous artwork marquee remains unchanged.
- The four local visitor marks were preserved. No marks were added, moved, or removed during validation.
