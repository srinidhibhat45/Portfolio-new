# Forma and OhCaptain portfolio additions

Added 16 October 2026. The portfolio now has 10 design studies and 21 product
stories, with 31 standalone case studies. Both new products lead the built-product
carousel, participate in product search, have original-interface previews and open
the same shared reader as the existing projects. Their themes also appear in the
connection map. Existing project content, the Indian portfolio identity, type scale,
floating music player, Jimmy and testimonials are preserved.

## Editorial scope

Both stories concern product ideation, UX direction and interaction design. They
are retrospective accounts grounded in artifacts, documentation and relevant source;
they do not assert code authorship, user research, adoption or measured impact.
Audience context is explicitly a design assumption; proposed evaluations are future
work. Each story has a problem, direction, three decisions with trade-offs, outcome,
reflection and supporting sources.

Forma is the native Android application in the Health++ project, not the React
design preview. The later 1.5 function audit takes precedence over the older
46-measurement design note: 44 native metric views, separate Devices and Your data
paths, and optional personal tools in settings. Experimental wellness estimates are
distinct from recorded measurements, proprietary Samsung scores and clinical
validation. Physical Samsung sharing is device-dependent. The product action leads
to the project's Android releases.

OhCaptain is a playable keyboard-and-mouse browser prototype. The story examines
captain/operator responsibilities, a shared treasury, persistent battle awareness,
Fleet controls, the expanded overview and the Clear Deck attention policy. Solo AI
fill is distinct from peer-to-peer rooms; host dependence and network limits remain
explicit. Menu concept art is never described as gameplay. The product action leads
to the supplied GitHub repository, without inventing a hosted game URL.

## Visual provenance

All listed delivery images are WebP copies of existing interface captures, with no
invented screens or research evidence.

| Delivery image | Source and treatment |
| --- | --- |
| `assets/case-study-evidence/forma-today.webp` | Health++ `output/forma-today-rings.png`, 1080 × 2400. Archived native capture with marked demonstration values; predates the later Health-tab/personal-tool cleanup. |
| `assets/case-study-evidence/forma-vitals.webp` | Health++ `output/native-v3/forma-vitals-overview.png`, 1080 × 2400. Native vitals/activity capture using sample values. |
| `assets/case-study-evidence/forma-data.webp` | Health++ `output/ux-audit/forma-data-panel.png`, 1080 × 2400. Later native Your data panel with explicitly labelled sample data. |
| `assets/products/forma.webp` | 1280 × 800 composition of the Today and vitals captures on the original near-black surface. Both screens are scaled uniformly; no screen content is changed. |
| `assets/case-study-evidence/ohcaptain-combat.webp` | 1280 × 720 browser screenshot of the local built game on 16 October 2026, in solo play with AI fill. |
| `assets/case-study-evidence/ohcaptain-map.webp` | 643 × 414 screenshot clipped to the actual expanded tactical map in the same session. |
| `assets/products/ohcaptain.webp` | 1265 × 712 browser screenshot of the game's harbor menu and station selection. The bundled cinematic artwork is identified as menu presentation; its original generation record is in OhCaptain `docs/BLACKWATER-ART.md`. |

The Forma inline decision detail crops the original Today capture at
`x=50, y=1710, width=980, height=430`. The OhCaptain detail crops its combat capture
at `x=14, y=484, width=270, height=222`. The visual manifest records both bounds.

The shared reading layout, chapter navigation, native disclosures, accessible
focus behavior and existing fonts remain the foundation. Forma uses its native
near-black/ivory/lime palette and bundled Plus Jakarta Sans. OhCaptain uses its
navy/steel/gold palette with DM Sans body type; the case-study display is an
editorial adaptation using bundled Archivo, while original Barlow lettering remains
visible in the product captures. No runtime font-provider dependency was added.

## Reading collection and verification

The product PDF contains 21 bookmarked chapters over 65 pages. Forma begins on
page 60 and OhCaptain on page 63. The six new chapter pages were rendered and
visually inspected. The design PDF and original project PDFs were not changed.

- All 70 existing tests pass, including full project/story coverage, artifact
  references, chapter links, source escaping, unique themes and connection-map data.
- The public build generates all 31 stories, the library, browser data and sitemap.
- Both standalone pages and both in-portfolio readers were checked at 1280px and
  390px, including section navigation, disclosure behavior and close/focus return.
- Checked controls distinguish the Android release from the GitHub project.
- Original captures, crop bounds and PDF chapter destinations were verified.
- Changes are local; no deployment was performed.

Impeccable's context engine was unavailable in this session. Existing project
sources and visual conventions supplied the design context; the mechanical and
visual checks above were performed directly. No new visual world was introduced.

## Scoped design handoff

The final source review confirms this is an extension of the incumbent portfolio.
The shared wine/ivory/textile shell, larger type scale, restored floating companions
and original testimonial presentation remain the authority. Product palettes and
fonts are recorded in `content/case-study-themes.json` and match the generated
project selectors; the new layout treatments are confined to the two case-study
layouts and Forma's product preview. No shared design-token replacement is needed.

Both generated stories retain the shared chapter reader and eight native
disclosures, with all five section destinations present. Their four images each
have alternative text, all referenced local links resolve, and the visual manifests
retain source dimensions, capture provenance and decision-crop bounds. The four
authored manifests, generated pages, product previews and verification record above
complete the handoff; the finish review accepted the additions for shipment.

Pre-existing documentation drift remains in `docs/impeccable-review.md`: historical
recommendations below its opening restoration note describe companion relocation,
smaller type and testimonial disclosures. That opening user-directed revision is
the current authority. The older report and the shared design documents were not
rewritten as part of this extension. No deployment was performed.
