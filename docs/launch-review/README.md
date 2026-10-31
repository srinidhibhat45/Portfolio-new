# Case-study launch review — 31 October 2026

Prepared for the planned 1 November launch. Repository delivery and deployment are separate: a push to main makes this batch available to the hosting pipeline; a live-site check confirms the published result.

## Completed

- Refined all 31 existing accounts and added the six projects selected by Srinidhi: Halo, Binnder, PureEQ, Hidden Identity Chess, 5 Dead and Alibi.
- The library now contains 37 studies: 10 design studies and 27 product stories. Each has a static page, a portfolio reading view and a bookmarked PDF chapter.
- Reworked headlines, outcomes and reflections into direct first-person prose. Preserved original research counts, team credits and project limitations. Proposed evaluations remain future work. Product roles describe ideation, UX and interaction design, rather than code authorship.
- Put original work beside the introduction on desktop, exposed supporting screens in the outcome, removed repeated imagery from the sources footer and used correct image dimensions.
- Kept the wine/ivory portfolio, Indian motifs, established section scale, Jimmy, the music player and original testimonial cards. Reading copy is 18px on phones and desktop. The writing study retains its larger serif treatment on desktop.
- Updated product cards, search, the brain map, project counts, sitemap, local fonts and versioned asset URLs. Tall native screenshots retain their full proportions in the library.
- Replaced the four image-free treatments for DashF1, Hued, PreMoney and Wheelie with genuine captures. Changed the homepage statistic label to “Projects & concepts” to include the visual concepts accurately.

## Image provenance

| Project | Material used | Scope of the capture |
| --- | --- | --- |
| Halo | Existing editor.png and classic.png from Action-Ring/docs/images | Original editor capture and documented ring graphic; the latter has an illustrated background. |
| Binnder | Native Android 0.1.1, isolated emulator | Review and confirmation screens with a sample copy of the public OneSpace deck. No permanent deletion confirmed. |
| PureEQ | Native Android 1.5.2, isolated emulator | Welcome and preparation only. No listening responses or hearing result represented. |
| Hidden Identity Chess | Local /game/ build | Actual setup and computer-play views. Original rules credited to Triple S Games. |
| 5 Dead | Existing outputs/5dead-arena-v2.png and 5dead-card-faces-phone.png | Actual game presentation. Generated arena, avatar and card artwork are identified as assets inside the game. Independent 5 Alive adaptation and larger-table house rules disclosed. |
| Alibi | Local VideoImposter browser app | Landing interface and solo-practice lobby with explicitly simulated opponents. No real call, camera or microphone recording. |
| DashF1 | Local f1dash/dist | Historical 2025 Monaco replay using OpenF1; not a live session. Heuristics remain labelled. |
| Hued | Existing release APK, isolated emulator | Genuine sign-in screen. Core daily photography flow described from project documentation, not shown as a captured session. |
| PreMoney | Existing 1.13.0 release APK, isolated emulator | Empty dashboard; SMS permission skipped, no bank messages or financial records. Current-source optional external processing remains qualified in the story. |
| Wheelie | Existing release APK, isolated emulator | Genuine sign-in screen; no account or rider location used. |

The user explicitly approved ADB for the separate test emulator, emulator-5580. The existing emulator-5554 and its app data were not used. Other existing studies retain their original decks and archived product captures. Source projects and their local changes were not committed or pushed by this work.

## Repository visibility

At Srinidhi’s explicit request, PureEQ, 5Dead and VideoImposter were changed from private to public. GitHub subsequently returned `private: false` and `visibility: public` for all three, and their pages opened in anonymous HTTP requests. Halo and Binnder were already public.

Before the change, mirrored repositories were scanned with Gitleaks using all refs and redacted output. No leaks were found. Sensitive-path review found no tracked key stores, private keys or databases; VideoImposter includes an example environment file. All three had zero issues, Actions runs and releases at the time of review. These are bounded checks, not a guarantee that an automated scanner can identify every kind of sensitive material.

## Validation

- 71 Node tests passed, including all 37 case-study pages, destinations, source files, rendering safety, reading links and catalog coverage.
- Four existing local preview-server tests passed.
- Production build succeeded and contains 38 case-study HTML files including the index. Local data, development audit pages and source-review mirrors are excluded.
- All 37 lead images exist locally, have truthful provenance and match their intrinsic dimensions. All project ink, secondary text and accent colors meet 4.5:1 against their project background.
- Confirmed all 37 studies at 1280px and in a real 390px iframe: no horizontal overflow, no loaded-image failures, one genuine lead image each, 18px phone reading text. See responsive-results.json.
- Narrow-phone and tablet samples cover the six additions plus representative existing layouts. A 320px OneSpace headline overflow was fixed and separately confirmed. The original finding and its resolution are retained in the results file.
- Verified native decision disclosures and exclusive expansion. Verified Halo opens in the portfolio viewer, close receives initial focus, and closing returns focus to the originating Halo card.
- Reviewed screenshots of the six additions, representative existing layouts and phone reading. The game headlines retain their original display family; long reading headings use the body family for legibility.
- PDF collections rebuilt: 32 design pages and 83 product pages. Rendered all 18 new chapter pages, a representative original chapter and the corrected Devanagari caption. All PDF pages checked for empty text and unsupported-glyph markers; none remain.
- The automatic Impeccable design hook reported no deterministic issues on the edited project stylesheet. Visual review was performed separately.

The browser viewport control did not update document dimensions. Responsive QA therefore used a temporary same-origin iframe at measured widths instead. Those audit fixtures are ignored and excluded from publication.

## Final readiness check

The reading collections now use content fingerprints in their download links, shared by standalone studies, the library and the portfolio viewer. This prevents an older browser-cached collection being served after the PDF is refreshed. The production build and all 71 Node tests passed after this fix.

## Remaining publication step

After the main-branch push, check the hosting deployment and verify the contact form and guestbook on the live domain. The local preview remains available at http://localhost:8000/case-studies/. Existing product limitations remain in their studies: untested concepts are not described as validated outcomes, experimental wellness estimates are not clinical results, and isolated captures do not imply a conducted user study.
