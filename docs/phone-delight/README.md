# Phone layout and playful details

Completed 1 November 2026. Changes were reviewed locally before release.

The existing wine and ivory palette, textile artwork, original portrait and jaali remain. Phones now use a larger two-line name, a generous portrait, 17–19px supporting copy, larger case-study controls, safe-area spacing and clearer project navigation. Jimmy and music remain hidden at 600px and below; their desktop corner positions are unchanged. Testimonials retain their original flip-card presentation.

The jaali button turns the decorative layer by a quarter-turn without rotating the portrait. Reduced-motion preferences remove its transition. “Surprise me” opens a genuine authored case study through the existing reader, avoids an immediate repeat and returns focus when closed. It falls back to the case-study library without JavaScript.

## Verification

- Browser layouts inspected at 320×568, 390×844, 430×844, 768×844 and 844×390, plus desktop. No horizontal page overflow was observed. These are browser viewport checks, not physical-device certification.
- Confirmed the jaali action, narrow-phone project arrows, scrolling landscape menu, original testimonial flip, dark theme and project discovery. The discovery reader fits at 390px, focuses its close button and restores focus to its trigger.
- Enlarged small gallery, email-copy and map controls. Fixed spoken labels in the map and jaali button, the selected board tool’s hover contrast, and an overlapping starter sticker.
- Final rendered phone axe check: **zero confirmed violations, 52 passing rules**. Automated review still leaves checks incomplete for textured backgrounds, some SVG labels and controls that create their dialogs lazily; this is not a claim of full accessibility certification. The result is retained in `accessibility.json`.
- All 71 automated tests pass. Production build and whitespace checks pass.

## Detector exceptions

The design hook’s shared configuration contains exceptions scoped to `index.html`, because its static analysis combines unrelated rules from the site's layered stylesheets. The tool does not support individual values for these rules. Preserved cases are the lazy lightbox image, decorative clipping, small original testimonial/desktop companion labels and zoomable board lettering, and a false foreground/background contrast pairing. The real hover contrast issue was fixed. Old blue shadow colors were replaced with neutral elevation. No project-wide rules or entire files were disabled.

Screenshots: `phone-hero.png` and `desktop-hero.png`.

## Final inherited-style scan

The stop-time scan also reported 50 findings with unknown attribution. Comparison with committed sources confirms the flagged elastic curve, width transitions, textile wash, old timeline stripe, marquee, blue halo, amber shadow and small game labels predate this batch. Their declarations appear in the existing `style.css`, `playful.css`, `atelier.css`, `textiles.css` and timeline stylesheets. None were introduced by the new jaali control or discovery link. The new control uses a non-overshooting curve and the discovery divider is 1px.

The existing ivory palette, Instrument Serif and original testimonial label are recorded as scoped design exceptions. Other inherited findings remain standing for a separately authorized review: game-control legibility, old transitions, unused layered styles and decoration. They have not been treated as regressions, suppressed wholesale or used to expand this phone refinement.

The user subsequently approved that older-style review. Its changes, tests and intentional exceptions are recorded in `../legacy-style-cleanup/README.md`; the older findings are no longer a pending scope decision.
