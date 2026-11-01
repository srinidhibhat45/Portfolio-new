# Older styles and game controls

Completed 1 November 2026, following approval to review the older styles. Changes were reviewed locally before release.

## Changes

- Shared 12px game-label floor, 14–15px game instructions/status text and 44px utility controls. Small legacy overrides were corrected at their source, including mobile chess clock labels, score labels and memory-tile captions.
- Replaced overshooting transitions with the existing smooth ease-out curve. Menu and underline interactions now reserve their space or use transforms rather than animating widths/padding. Removed unnecessary timeline hover stripes.
- Case-study progress now updates with `scaleX`, preserving the 0–100% reading indicator without animating layout width.
- Removed unused aurora orbs, portrait glow, ticker rules and their keyframes. Replaced the remaining amber hover shadows with neutral elevation.
- Made the original RPS filigree more visible. Fixed win/loss background shorthands that were hiding the result rosette behind a solid square.
- Added keyboard focus and a visible focus ring to the scrollable chess move history. Keyboard End reaches the final moves.
- Enlarged utility labels for résumé, availability and note composition.

The wine/ivory materials, genuine project imagery, portrait and jaali remain. Testimonials retain their original presentation. Jimmy and music stay in their original desktop corners and remain hidden on phones.

## Verification

All nine game panels fit at 320px, 390px and 1280px with no horizontal overflow. Visible game labels met the 12px floor; hidden ornament glyphs and the local audit fixture were excluded. Tablet tabs fit at 768px. The 844×390 landscape layout keeps its compact chooser and scrollable dialog.

The rendered phone cricket result and final chess checks report zero confirmed axe violations. Some automated checks remain incomplete for background images and dynamically created controls; these are not full accessibility certifications. The chess history receives focus and scrolls from the keyboard. A hand-selection action enters the expected game reveal. The case-study reader reaches `100% read` with `scaleX(1)`. Menu links fit without horizontal clipping.

All 71 tests pass; production build and whitespace checks pass. These checks use browser viewports, not physical devices. `checks.json` retains measurements and audit results. `phone-game.png` and `desktop-chess.png` show the final presentation.

## Intentional detector exceptions

The final static findings were triaged against the rendered interface and existing source. Exceptions scoped to `index.html` preserve literal cricket wickets, the canvas dot grid, game tables containing playing elements, full-width section/row alignment, large display-title leading, hidden/inactive image states, faint textile material and the original testimonial labels. The previous font/palette exceptions also remain. The hook does not expose individual values for these structural rules, so its file-scoped configuration is used; no project-wide rules or whole files are disabled.

The elastic easing, layout-width transitions, obsolete ticker/glows, unreadable live game labels and keyboard-scroll defect were fixed rather than suppressed.

Final static follow-up: removed the unused blue status-pulse keyframes, replaced the remaining inherited blue button/portrait shadows with neutral values, and replaced the base form-field halo with a clear focus outline. No exception was added for that finding.

Remaining warm-shadow classification: the next static finding names `#532d3a`, the portfolio’s wine ink. Its blurred shadows carry an offset and sit on cream paper (for example, notebook depth is `0 10px 28px #532d3a0c`); the zero-offset dots-game mark is a crisp 1px last-move ring. These are retained as material depth and a game-state indicator. A `dark-glow` exception is scoped to `index.html`, since the tool cannot isolate a color value and classifies this mixed light/dark page as uniformly dark. The compact chooser is unchanged.
