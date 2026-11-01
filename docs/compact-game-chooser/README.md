# Compact game chooser

Replaced the growing desktop tab grid with one native game selector across desktop, phone and landscape layouts. Removed the old tab markup, styles, event handlers and breakpoint focus transfers. Game sections are now individually named regions, and the selector identifies its active region through `aria-controls`. The game count derives from the options.

Verified all nine games at 1280px and 320px. The chooser stays 74px tall for every game, without horizontal overflow; compact landscape is 66px tall and keeps its help control. One game region is visible at a time. The existing switch path still retains each game's state. Native keyboard focus and option semantics are preserved.

The final rendered Dots & Boxes accessibility check reports zero confirmed violations. A pre-existing label issue on its nine box graphics was corrected with image semantics. Incomplete automated checks remain recorded in `checks.json`.

All 71 tests and the production build pass. Changes were reviewed locally before release. `desktop.png` shows the finished chooser.
