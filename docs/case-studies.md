# Case-study editorial refresh

Prepared 15 October 2026 for UX Designer and Design Engineer applications, with
senior-level emphasis on framing, prioritisation, systems, constraints, and critique.
The user clarified that the apps should demonstrate product ideation, UX direction,
and interaction design, without claiming code authorship, framework selection,
or coding efficiency. Product contributions and process copy now follow that scope.

## Deliverables

- 29 standalone, readable case studies at `/case-studies/`, including a six-story
  starting selection. These pages contain full HTML and need no JavaScript.
- The existing portfolio viewer now renders the same articles for both project
  collections, with product/prototype links and restored focus on close.
- Two bookmarked PDF reading collections: 10 UX chapters and 19 product chapters.
  Each chapter has a brief, approach/decisions, and outcome/reflection page.
- Original PDFs and archived captures remain available as supporting artifacts.

## Editorial standard

First-person prose reflects ownership described in the original artifacts and
the user's project catalogue. The accounts are explicitly retrospective. Visible
features and source documentation support the rationale, but do not establish that
every rationale was recorded at the time of development. Proposed studies are
future work; no participant quotes, test results, launch dates, revenue, awards,
customers, or conversion gains have been invented.

The sparse visual concepts are not inflated into commissioned or launched products.
uMatter preserves the team credit: Srinidhi led UX research/design; Pratik Manjrekar
contributed UI design; Nidhi S Kamath contributed UI/graphic design.

## Evidence and corrections

| Project | Grounded material | Treatment |
| --- | --- | --- |
| OneSpace | Original deck pp. 2–7, 11–17; 127 responses, 5+ interviews | Corrected the old course-discovery description to education communication. Includes contradictory survey evidence and narrows the proposed first release. |
| uMatter | Original deck pp. 2–7, 10–18; 65 responses, 14 hours, three named contributors | Describes access and booking, without clinical efficacy claims. Drops the old comparison of an informal self-report survey to a WHO prevalence figure. |
| MuCoin | Original written rationale pp. 1–11 and existing prototype URL | Personal finance, not crypto. All numerical KPI targets remain targets; the unsupported 100% completion prediction is critiqued rather than repeated as a result. |
| GetMetaData | Original deck pp. 3–14 and existing prototype URL | Three historical competitor reviews on one common page. Personas are framing devices without interview validation. Extraction bug is separate from interface redesign. |
| Steve Wilson | Original four-page concept | Fictional identity, client example, placeholder percentages and dollar values are not real credentials or results. Home/listing imagery is used instead of promoting the mock client/results template. |
| Gloria Furniture | Original long-page concept | Product prices, warranty and contact content are illustrative. No commerce or checkout claim. |
| Fun Cruises Goa | Original long-page concept | Discovery/enquiry scope only; no completed reservation flow or conversion evidence. Old prices are not current offers. |
| BNI Goa | Original long-page concept | Global organisation figures are not project impact. Repeated mock biographies are not real chapter evidence. |
| IRCTC | Original homepage concept | Independent, uncommissioned concept. No full booking-flow or time-saving claim. |
| Nitya Nanda | Original long-page concept | Shoot credentials and locations are concept content; no claim of real commissions. |
| Arkitype | README; lib/systemAreas.ts; lib/componentLanes.ts; docs/GETTING_STARTED.md | Current registry contains 90 components, replacing the portfolio's 50. Eight decision areas; beta scope is distinct from customer traction. |
| AppleCider | README; docs/architecture.md; src/io/export.ts; src/store/store.ts | 250 is a documented library scope count. Local file ownership and export are implemented properties, not measured team-efficiency gains. |
| PlanIt | README; src/core/resolve.ts; src/core/store.ts | Uses multiple views of one plan. Removed the portfolio's stale seven-view count. Highlights pins, opt-in resolution and forward-only changes. |
| Earthlog | README, especially What it answers and Honesty notes | Source freshness and model uncertainty remain visible. No scientific-validation claim. |
| HexChess | README and documented rule/session/test surfaces | 91 cells and six lessons. No measured Elo, authenticated multiplayer, or proven learning gain. |
| DashF1 | README, race modes and lap-model explanation | Free-feed estimated positions are distinct from GPS; replay and live coverage differ. No independent accuracy claim. |
| Hued | README; src/lib/dailyColor.ts and scoring.ts | Daily colour and local scoring; AI-image suspicion remains a tentative heuristic. No unlimited-scale or reliable-detector claim. |
| Yuva Panaji | README; src/lib/db.js | Updated SQLite/Decap summary to current Supabase-backed public/admin service. Removed the unverified 153-event count from homepage copy. |
| DeckForge | README, extraction and limitations; src/engine and src/store | Reconstruction and raster fallbacks; remote pairing is distinguished from core local editing. |
| Vansh Vriksha | README; src/lib/archive.ts | Public archive uses versioned JSON records and graph traversal, not the old Supabase summary. Demonstration dataset does not establish verified family counts. |
| PreMoney | PrithMoney/lib/domain/sms/sms_parser.dart; categorize; ai/groq_service.dart; UI sandbox | Parser confidence/rejection is real source structure. External enrichment/sync means no blanket on-device privacy claim. Folder/product naming mismatch is explicit. |
| SoundBox | README, listening/practice details | No independent recognition benchmark or learning results. |
| Wheelie | README and design.md | Beta; accessibility/glove polish in progress. Target-size intent is not proof of safe road use or conformance. |
| Matinee | README | Current React Native/Expo implementation. Excludes unsupported 70%+ recommendation accuracy. |
| BirthSky | StarMap/index.html; js/app.js; astronomy.js; exporter.js | Time/place-to-render/export workflow. Configured logging prevents a blanket private/local claim. Historical accuracy requires validation. |
| ScaleSee | README category list and numerical notes | Eleven listed categories, despite an older ten-category heading. Explicit scale transforms. |
| Where Would I Be…? | README, layout/model-limit sections | Constant-velocity extrapolation, not historical reconstruction or geological prediction. |
| The Blog | README editorial workflow | Build-based publication, verse and series conventions; no readership claims. |
| The Office Games | src/App.jsx and src/gameService.js | Reviewed trivia module only. Local mock mode is not multi-device network play. Broader games catalogue is not verified by this source. |

Product-source snapshots were read from
`/Users/srinidhibhat/Desktop/Claude-Root/personal/` (including the folders Arkitype,
AppleCider, PlanIt, PDFPresenter, Earth's Event Log, hexchess, f1dash, Hued,
Yuva-website, Saraswat Lineage, PrithMoney, SoundBox, Wheelie, Matinee, StarMap,
ScaleSee, Where would I be...?, Blogs, and theofficegames).
Only relevant documentation and implementation were consulted; credentials,
private databases and participant records were not copied into the portfolio.

## Information that would strengthen a later edition

Project-specific dates, actual time spent, the boundaries of collaborators' work on
independent products, original research instruments, participant recruitment,
anonymised interview notes, tested iterations, release analytics, and real feedback
would support stronger historical accounts. Missing material has been replaced with
clear scope and proposed evaluation, rather than invented evidence.

## Editing and rebuilding

`content/case-studies.json` holds the evidence-grounded core copy.
`content/case-study-stories.json` holds the opening situations, insights, journeys,
audience framing and annotations. `content/case-study-themes.json` holds each
project’s palette, type pairing, layout, chapter order and headings.
`content/case-study-visuals.json` records the original visual artifact, provenance,
dimensions, caption, presentation and optional interface-reading notes. Edit these
sources before rebuilding; do not edit generated HTML or browser data.

To rebuild the PDF collections, use the bundled Python runtime with reportlab,
pypdf and Pillow to run `tools/build_case_study_pdfs.py`. It writes two PDFs and
`content/case-study-pdf-pages.json`, recording actual chapter destinations.

`npm run build` regenerates standalone HTML, browser story data, the sitemap, and
the public `.dist` package. PDFs are checked-in outputs and are not rebuilt during
a hosting build. This keeps deployment independent of a Python runtime.

Intermediate PDF extraction and QA images live in ignored `tmp/pdfs/`.
The public build includes only website files, the original artifacts, and final PDFs;
this evidence ledger and local source paths are not included.

## Initial edition verification (15 October)

- 54 JavaScript tests and four local preview-server tests passed.
- Every project maps to one complete story; static pages have valid local
  assets and reading links, and work without JavaScript.
- Browser checks covered the design and product viewers, product and original
  artifact destinations, section navigation, focus transfer to sections, Escape,
  focus restoration, and wrapping Tab from the final article link.
- At 390px and 1280px, the article had no horizontal overflow. Desktop uses the
  reading sidebar; the narrow layout uses a wrapping contents list.
- Both collections rendered successfully. The 32-page design collection has ten
  chapter bookmarks; the 59-page product collection has nineteen. All 91 pages
  were visually reviewed in contact sheets, with representative pages inspected
  at larger size. The final outcome-page revisions were rendered and inspected.
- All chapter destinations, three decisions per chapter, and content sections
  were checked against the final PDFs. Original PDFs have no Git changes.
- The site build passed; no deployment was performed.

## Storytelling and project art direction (16 October)

The reference was Growth.Design’s case-study collection, particularly the Trello
onboarding and Grammarly survey stories. The borrowed principle is a concrete
situation, a revealing detail, consequential choices, and a considered next step.
No reference artwork, character designs, dialogue or study results were reused.

- https://growth.design/case-studies
- https://growth.design/case-studies/trello-user-onboarding
- https://growth.design/case-studies/grammarly-onboarding-survey

All 29 projects have individually authored story beats and a distinct art-direction
identifier. Shared semantic HTML and keyboard behaviours remain reusable. Chapter
order varies between research-first, early product tour, and system/workflow stories.
Layouts vary through hero composition, real artifact placement, reading rules,
decision structure, visual emphasis, card treatment and spacing—not just hue.

The three historical persona accounts come from the original decks: OneSpace’s
Vivek, uMatter’s Shritija, and GetMetaData’s specialist/business-owner framing.
GetMetaData’s personas remain explicitly unvalidated by interviews. The other 26
audience panels are task-based design assumptions, without invented demographic
profiles, quotes, participants, testing sessions, or success metrics.

The first-person product copy now concerns ideation and UX decisions. Product
features describe what is available in the artifact, not what code the user wrote.
Product cards and modal headers no longer foreground framework stacks. Both linked
PDF collections were regenerated to remove the previous implementation contribution.
Their document format remains a reading collection; the new art direction is for
the website. Original project PDFs are preserved.

### Visual sources

Product palettes and type names were read from the corresponding project style
files: Arkitype globals/layout; AppleCider tokens; PlanIt tokens; Earthlog app CSS;
HexChess styles; DashF1 styles; Hued theme; Yuva globals/layout; DeckForge tokens;
Vansh globals/layout; PreMoney theme; SoundBox tokens; Wheelie theme; Matinee
showcase; BirthSky styles; ScaleSee styles; Where Would I Be styles; Blog tokens;
and Office Games styles. UX palettes follow their archived covers/screens.
OneSpace, uMatter, MuCoin and GetMetaData PDFs embed Poppins; the remaining older
concepts use a visually compatible editorial pairing when no named font is
recoverable from the outlined artifact. This is a case-study adaptation of each
project’s identity, not a claim that every editorial component existed in the app.

Fonts are self-hosted. Google Fonts CSS supplied the Latin webfont files and the
Google Fonts repository supplied each family’s OFL/Apache licence. Individual
licences are retained under `assets/fonts/`; there are no runtime font-provider
requests. The complete font set is approximately 1.2 MB; a page requests only the
faces used by its own typography.

### Follow-up checks

- 56 JavaScript tests pass, including all project coverage, distinct story/layout
  assignments, valid reading order, audience provenance, escaped authored emphasis,
  and design-only product contributions.
- All 30 generated pages have valid local reading links and assets. All 51 inline
  SVG fragments parse. Every local font reference resolves.
- All project body, secondary-text and accent colours pass a 4.5:1 check against
  their main surfaces; text on the highlight wash passes the same check.
- The site build passes. After explicit user approval restored localhost access,
  all 29 stories were checked at desktop width and 390px without horizontal
  overflow. Representative project openings, dark content, original persona
  framing, and the story library were visually reviewed. The modal section jump,
  native trade-off disclosure, wrapping Tab, Escape, and returned card focus were
  checked. Long textual fact labels were refined and reviewed again on mobile.
- The corrected product PDF still has 59 pages and 19 bookmarks. All its pages
  were rendered and reviewed in contact sheets; contribution checks confirm that
  code authorship is not asserted. Original PDFs remain unchanged.

## Original-artifact visual revision (16 October)

Following the user's feedback on the generic illustrations, the website now uses
original interfaces and document excerpts as its main visuals. The generated SVG
diagram system was removed, together with the decorative globe, floating cards,
sticky-note collage, tape, paper textures and rotated frames. Explanations use
short captions, numbered interface notes and restrained process sequences.
Project palettes, self-hosted fonts, chapter language and different reading orders
remain. AppleCider's editorial headings now use Inter; its sketch examples appear
only in the original product capture.

Two additional artifacts were copied from the corresponding project repositories:

| Project | Original source | Website copy |
| --- | --- | --- |
| Arkitype | `Arkitype/docs/images/workspace.jpg` | `assets/case-study-evidence/arkitype-workspace.jpg` |
| SoundBox | `SoundBox/docs/play-screen.png` | `assets/case-study-evidence/soundbox-practice.png` |

The Arkitype capture shows a demonstration workspace; the organisation name in the
screen is not presented as a real client. SoundBox shows the actual practice
interface. Other product visuals are the existing archived captures, and design
visuals are excerpts from the original PDFs. DashF1, Hued, PreMoney and Wheelie
use a typographic opening and scope notes because a usable interface capture was
not established. Their library cards also use typography. No substitute interface
or research result was invented. The PDF reading collections were not changed in
this visual revision.

### Verification of the revised presentation

- The public build succeeds and all 57 JavaScript tests pass.
- All 29 case studies were checked in the browser at 1280px and 390px. There was
  no page overflow; all 25 original hero artifacts loaded at both sizes.
- Earthlog, Arkitype, OneSpace, AppleCider and SoundBox openings were visually
  inspected, as were the restrained content layout and the revised story library.
- The portfolio viewer renders the same original artifacts. Chapter navigation
  focuses the destination, aligns it below the sticky contents bar, and Escape
  returns focus to the originating project card.
- The retired graphics module is absent from the source and public build.
- Updated visual proofs: `docs/earthlog-story-preview.png`,
  `docs/case-study-themes-preview.jpg`, and `docs/case-study-library-preview.png`.
- Changes remain local; no deployment was performed.

## Reading structure and content density revision (16 October)

The user identified a broader problem with the case studies: too much visible
text, competing full-width rows, small labels and no dependable reading pattern.
This revision applies to all 29 projects, not just the Earthlog example.

- Replaced the competing horizontal layouts with a main reading column capped
  at 720px and a separate contents rail. On phones the outline wraps above the
  content and the text stays in one column.
- Established five recognisable chapter purposes: problem, research/direction,
  design decisions, outcome and reflection. Project-specific chapter ordering,
  copy, themes and typography remain. Every decision heading was reviewed and
  rewritten around a concrete design action.
- Moved role and context into the introduction. Removed the three-column notes
  beneath the hero, repeated bridge links, decorative decision leads and duplicate
  result screenshots. Captions now sit directly beneath their images.
- Kept the core problem, insight, research scope, direction and result visible.
  Original process detail, audience context, illustrative scenarios, supporting
  annotations, future evaluations and source notes are available in disclosures.
- Three named native decision disclosures allow one expanded decision at a time.
  The first opens by default; each retains the choice, reasoning and trade-off.
  This works in standalone pages without JavaScript.
- Raised main text to 18px on desktop and 17px on phones, with 15–16px captions
  and supporting copy. The Blog uses its own larger serif body treatment.
- Added original-screen details beside relevant decisions in OneSpace, Arkitype,
  Earthlog and SoundBox. Crops are CSS views of the original files; their pixel
  bounds, source and captions are recorded in the visual manifest. They do not
  depict new UI or new testing evidence.
- Simplified Earthlog's visible copy, replacing abstract language with the actual
  question of current information, event discovery, dates and source limits.

### Verification of the new reading pattern

- Browser checks covered all 29 default pages at desktop and 390px, then opened
  the second decision and original-process detail on every phone page. No page
  overflow was observed, all original hero images loaded, and only one decision
  stayed open. Desktop text columns were 720px.
- The default body reading path contains approximately 330–420 visible words per
  project. This is a website content-density check, not a product impact metric.
- OneSpace research and screen detail, Earthlog's decision detail, and SoundBox's
  practice controls were visually reviewed. Project openings and the library
  previews were updated to reflect the new structure.
- Portfolio viewer checks confirmed the same reader, keyboard disclosure
  toggling, 28px section offsets, Tab wrapping to the first dialog control,
  Escape and restoration of the originating card's focus. Summary controls now
  participate in the shared focus trap.
- All 58 JavaScript tests pass; all static pages retain valid local artifacts,
  heading references and reading links. The public build succeeds.
- Current reading proofs: `docs/case-study-reading-preview.png` (OneSpace) and
  `docs/earthlog-decisions-preview.png`. Opening and library proofs were replaced.
- The original PDFs and reading collections were not modified in this revision.
  No deployment was performed.
