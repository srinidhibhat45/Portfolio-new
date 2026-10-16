# Phone layout review — 16 October 2026

The game chooser uses a labelled native select on narrow layouts (up to 760px)
and short landscape layouts (up to 1000px wide and 500px high). Wider layouts
retain the existing six tabs. Both controls call the same game-switching path,
update the same selected state and preserve the existing private saves.

The original launcher moves into the phone header as a gamepad button, then
returns to its original location on wider screens. The element is moved rather
than copied, preserving its listeners and focus return. Rules move beside the
picker in short landscape layouts, where the game heading stays compact and
pen-fight's canvas has a bounded height.

Additional phone changes:

- Larger game instructions, sliders, actions, status text and close controls.
- A compact companion row and clear single-column game layouts.
- Native fields use 16px text; narrow cricket choices use two rows.
- Header controls and key secondary controls have 44px touch targets.
- The game launcher no longer overlaps project cards, the résumé link or forms.
- Larger work-card copy, filters, map controls and visitor-board tools.
- Contextual board actions stay out of view while unavailable; the shared board
  and its data were not changed during this review.
- Note colours have readable labels and 44px targets. Note and introduction
  dialogs keep their close button reachable when the contents scroll.
- Short landscape menus use two columns and allow vertical scrolling.
- Floating shortcuts respect bottom safe-area insets; back-to-top is hidden
  while a form control has focus.

## Verification

Browser viewport checks covered 320×568, 360×740, 390×844, 430×932, 760×1024,
844×390 and a wider 1280×900 layout. The page, header and open game room had no
horizontal overflow in these checks.

All six select options were exercised on the smallest phone layout, with one
visible panel and the corresponding desktop tab selected. Desktop tabs also
updated the mobile select. Switching breakpoints transferred keyboard focus to
the visible picker or selected tab. The saved selection resumed after a reload;
no match was reset for the checks.

The landscape rules popover stayed inside the viewport. A small note dialog was
scrolled to confirm its close control remained visible and its colour targets
measured 44px high. Project search filtered and cleared normally. The phone case
study viewer retained 17px body text, a 44px close control and no overflow.

All 58 existing JavaScript tests pass. The public build includes the new stylesheet.
Checks used browser viewports; no note, doodle or contact form was submitted.

Current visual proofs:

- `docs/mobile-games-preview.png`
- `docs/mobile-home-preview.png`

Changes are local. No deployment was performed.
