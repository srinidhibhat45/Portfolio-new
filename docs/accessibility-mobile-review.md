# Accessibility and mobile review

Reviewed 8 October 2026. The final portfolio uses the pixel Shri Bot, solid chess pieces, chess-only 3+2 clocks, the Design Engineer About copy, and the brain directly above the blog. The visual-work wall keeps its three continuous scrolling rows.

## Method and results

Used axe-core 4.14.0 locally with WCAG 2 A/AA, WCAG 2.1 A/AA, WCAG 2.2 AA and best-practice checks. Diagnostic assets and reports are excluded from the published site. The final recorded desktop and phone scans have **zero automated violations in each recorded state**. Raw results, including checks that require human review, are in [accessibility-results.json](accessibility-results.json).

The scans cover:

- Desktop at 1280 × 720: page content, expanded services/testimonials/contact form, dark theme, and each of the six game panels.
- Phone at 390 × 844: light and dark page content, the expanded contact form, navigation, and each actual selected game panel.
- Note dialog and empty-note validation; recruiter overview; OneSpace case-study viewer; artwork lightbox.
- The ordinary animated gallery and its pause control, separately from the motion-paused audit view.

Automated checks do not establish full WCAG conformance. The remaining axe “incomplete” entries mostly involve image/SVG contrast, symbolic controls and the reference to a closed native dialog. These were inspected for intended semantics and readable labels. Existing case-study screenshots, posters and PDFs were preserved; their internal text was not recreated or OCR-audited.

## Fixes made during this review

- Strengthened low-contrast captions in the timeline, services, blog, testimonials, board, music widget, games and contact form. Corrected the timeline and cream notebook text in dark mode too.
- Made the gallery pause control readable on its dark background.
- Replaced invalid button roles on visitor-note articles with appropriate interactive containers. Their accessible names include their visible text; arrow-key movement remains available.
- Matched graph labels, game tabs, clock controls and chess-coordinate labels to their visible content. Added small-board groups in Ultimate and names for its guide and Shri Bot.
- Kept focus on the chess square after the board updates. Arrow keys navigate squares; Enter selects a piece or legal destination. Resign asks for confirmation and initially focuses “Keep playing”.
- Enlarged result-view buttons and retained clearly labelled in-board win/loss/draw results and rematch controls.
- Increased graph-label contrast, including counts and dimmed nodes. Added proper groups to project-navigation controls.
- Prevented chess/Ultimate boards from shrinking into tiny squares on short landscape screens. The mobile menu now scrolls vertically when its links exceed the screen height, with its scrollbar hidden.

## Manual mobile and interaction checks

| Viewport | Observed result |
| --- | --- |
| 320 × 740 | All six games fit the dialog width: 302px of content in a 302px dialog. Ultimate cells measured approximately 24.9px. Games retain vertical scrolling rather than compressing controls. |
| 390 × 844 | Hero, menu, project sections and game panels reflow. No horizontal page overflow was observed. |
| 768 × 1024 | No section exceeded the viewport width; the page content measured 758px. |
| 844 × 390 | Chess remains 280px wide. The 497px menu content can scroll within the 390px screen height. |
| 1280 × 720 | All six selected game panels passed their desktop scans; the room and controls fit with scrolling available. |

Keyboard checks included menu opening, Escape and focus return; chess piece selection, arrow navigation and a legal e2–e4 move; draw acceptance; confirmed resignation; rematch; the untimed toggle; case-viewer Escape and focus return; note validation; and brain search/list navigation. Searching Yuva exposes the Executive Member role and all six pillars.

Game interaction checks included card Stay with the bot resolving the hand, hand-choice feedback in stone/paper/scissors and cricket, and a legal Ultimate move that directs the opponent to board 5. Rules tests cover complete match outcomes, legal bot replies, castling, en passant, promotion, checkmate, stalemate, repetition, flexible card aces, cricket wickets/chases/ties, Ultimate destination rules, and pen collisions.

The gallery tracks were observed changing position over time, with rows moving in opposite directions. Pause/resume works. Clones stay outside the keyboard tab sequence; original artwork remains selectable. Reduced-motion styles and the alternate artwork grid are retained.

## Chess clocks and private saves

Only chess displays or uses a timer: three minutes for each player, plus two seconds after that player moves. The other five games are untimed. Closing the room, switching games or hiding the page pauses chess thinking time. Visitors can choose an untimed chess game.

Clock values, chess history, results and the other game states stay in the player's browser database with a local recovery copy. Automated storage tests confirm persistence across store instances and isolation between independent browser databases. This is browser/profile-specific storage, not cross-device sync. Clearing site data clears the saves. No public game-score endpoint is used.

Draw and resign stop play and show explicit results. A timeout against an opponent with only a king is a draw. Shri's custom casual chess profile targets approximately 1100 strength; it is not an independently calibrated Elo rating.

## Validation and limits

- 31 JavaScript tests passed.
- 4 local visitor-board API tests passed using a disposable database.
- Public-site build passed; local visitor data, audit tooling and development reports are excluded.
- Final browser error-log inspection was empty in the tested preview.
- Original project data and case-study data files are unchanged; existing local visitor marks were not modified by the review.

These are browser viewport checks, not a physical iPhone/Android or assistive-technology certification. Real-device Safari/Chrome, VoiceOver/TalkBack, browser text enlargement, and the accessibility of existing PDFs remain follow-up checks. The third-party YouTube player and hosted Netlify form/guestbook should also be verified after deployment; the review did not submit a contact message or add public visitor marks.

Reference methods: [axe-core](https://www.deque.com/axe/axe-core/), [axe API](https://github.com/dequelabs/axe-core/blob/develop/doc/API.md), [WCAG timing adjustment](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable).
