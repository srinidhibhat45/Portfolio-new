# Generated textile artwork

Generated with the built-in image generation tool on 9 October 2026. Original interpretations of Indian textile traditions, not reproductions of apparel brand designs.

## Saved assets

- `assets/img/textiles/paisley-brocade.webp`: brocade boteh for about / contact / menu margins.
- `assets/img/textiles/parakeet-vine.webp`: botanical artwork in its own desktop writing column.
- `assets/img/textiles/jaali-medallion.webp`: geometric portrait ornament; retains the slow rotation.
- `assets/img/textiles/ajrakh-field.webp`: small faded geometric print accents.
- `assets/img/textiles/sari-border.webp`: unused generated border study; no longer displayed.
- `assets/img/textiles/sari-border-vertical.webp`: unused vertical derivative; no longer displayed.

PNG masters are preserved locally in ignored `assets/_src/textiles/`. WebPs preserve alpha and use quality 84. Border preparation trims transparent padding and rotates a vertical derivative.

Illustrations stay clear of text. Narrow textile hems are removed. Larger print motifs use rounded fade masks at the margins, and phone hero edges stay clear. Decorative artwork is hidden from assistive technology, cannot intercept pointer input, and respects reduced motion. Gallery animation, portfolio content, and project interactions remain intact.

# Final generation prompts

## pallu

Use case: stylized-concept. Asset type: premium Indian textile ornament for a cream-and-burgundy personal portfolio, transparent cutout. Create ONE exquisite paisley brocade ornament, not a pattern sheet or moodboard. Tall portrait composition, with one large curving mango-shaped boteh and one smaller companion, gracefully arranged with generous empty transparent space around them. Expert textile designer craftsmanship inspired by fine Banarasi zari and Kashmiri shawl ornament: beautifully proportioned teardrop curls densely filled with delicate branching tendrils, tiny leaflets, finely articulated blossoms and nested ornamental bands. Intricate yet exceptionally clean and crisp, polished hand-painted print artwork with restrained ink-filled shapes and extremely fine engraving, no crude outline-only sketch. Palette: matte antique gold, warm sand, muted burgundy, dusty indigo and a touch of sage. Elegant flat artwork with subtle handmade ink texture, no 3D gold shine. Designed to remain gorgeous as a quiet website edge illustration. Isolated on genuinely transparent background; clean alpha edges. No text, no letters, no watermark, no frame, no mockup, no people, no checkerboard drawn into image. Entire ornament visible, nothing cut off.

## vine

Use case: stylized-concept. Asset type: an elegant Indian pen-painted botanical illustration for a portfolio writing room, genuine transparent cutout. One tall graceful Kalamkari-inspired flowering vine with two beautifully drawn Indian parakeets perched naturally among sophisticated curved foliage. A museum-quality textile illustration with fine expert botanical drawing, rich ornamental detail, controlled outlines and gently filled colour shapes. Accurate elegant birds with recognisable beaks, wings and tail feathers; no cartoon birds, no childlike twig or leaf doodles. Slender S-curving branching stem, layered finely veined leaves, delicately articulated small flowers and buds, restrained airy arrangement with transparent gaps. Muted dusty indigo birds, sage foliage, burgundy flower accents, warm sand and matte antique-gold ink detailing. Very clean professional illustration, crisp edges, subtle block-print texture, calm regal character. Tall portrait framing, all leaves and birds visible, transparent negative space outside silhouette. No paper background, no text, no logo, no watermark, no border rectangle, no photograph, no 3D. Nothing cropped.

## medallion

Use case: stylized-concept. Asset type: transparent decorative medallion that slowly rotates behind a portrait on an Indian personal portfolio. Create ONE beautifully crafted circular Indian ornamental medallion, perfectly centred and rotationally balanced, with exquisite fine detail. Inspired by carved architectural jaali and antique zari embroidery: several concentric bands of interlaced eight-point stars, scalloped arches, miniature paisley seed motifs, intricate lattice and precise fine gold beading. Sophisticated geometry rather than a generic flower mandala. Flat engraved print artwork, highly refined expert craftsmanship, delicate line weights and controlled small filled accents, no thick cartoon outlines. Predominantly matte antique gold and warm sand with very restrained muted burgundy and dusty indigo details. Airy filigree with substantial transparent gaps; no solid opaque disk. Square framing, complete circle visible with transparent margin on every side. Genuine transparent background, no paper, no checkerboard drawn into image, no text, no logos, no watermark, no shiny 3D metallic render.

## border

Use case: stylized-concept. Asset type: clean transparent Indian textile border illustration for a refined cream and burgundy website. Create ONE long straight horizontal ornamental ribbon, not a mockup. Very wide landscape image, ribbon spans nearly full width and occupies the central third of the canvas height, generous transparent margins above and below. Richly detailed yet delicately scaled block-print / woven sari border inspired by Indian artisan textiles: repeating nested stepped diamonds alternating with small paisley seed forms, tiny fine running stitches, minute leaf flourishes, precise layered inner and outer border bands. Expert professional ornamental textile artwork, exceptionally clean symmetry and finely controlled edges; no giant icons, no childlike geometric doodles, no rough thin outlines. Restrained dusty indigo, burgundy, sage, terracotta and matte antique gold colours; delicate filled motifs, subtle hand-printed texture, no shiny metallic effects. Flat decorative artwork, genuine transparent background, all edges clean. No text, letters, logos, watermark, paper backdrop, cloth photograph, folds, frame or 3D. One straight continuous horizontal ribbon.

## blockprint

Use case: stylized-concept. Asset type: refined original Indian textile pattern for small decorative panels on a cream and burgundy portfolio website. Create a beautifully detailed square repeat pattern inspired by artisan Ajrakh block-print textiles. Crisp intricate interlocking eight-point star geometry with fine nested outlines, small botanical seed motifs, rosette centres and tiny dotted border details. Rhythmic, beautifully balanced precision with authentic subtle ink-print texture. Sophisticated dusty indigo, burgundy, terracotta and muted antique-gold ink on a warm pale ivory #f0e9dd ground. Keep cream negative space between motifs; not a dark heavy filled tapestry. Expert contemporary textile art, richly crafted minute details rather than generic computer-generated triangles or simple outline stars. Flat front-facing artwork that fills the entire square, seamless repeat composition, no perspective or cloth folds. No text, logo, watermark, objects, photo, mockup or shadows.


## Placement refinement

Continuous side strips and horizontal ribbons were removed after review: their small scale compressed the artwork into heavy lines. Hero accents now show recognisable, larger Ajrakh motifs in asymmetrical patches with soft fades. Gallery and testimonial transitions have no extra decorations. The portrait, parakeets, and brocade illustrations are retained.

## Verification

- Build and all 34 regression tests passed.
- Desktop and mobile light/dark Axe checks reported zero detected violations. Patterned and pseudo-element backgrounds produce incomplete contrast results, so readability was reviewed visually as well.
- No horizontal page overflow at 1280×720, 393×694, or 320×568.
- The full portrait remains visible at 393×694, with its bottom at approximately 487 px.
- The former paisley, tree, medallion, ikat, jaali, and stitched SVG illustrations were retired. The small menu stamp and tied-dot hem remain code-native accents.
