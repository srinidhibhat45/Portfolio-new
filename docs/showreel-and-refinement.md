# Animated introduction and refinement

The showreel has a 16:9 space in About, following the introduction. It now plays [Srinidhi’s animated introduction](https://youtu.be/YmEOMID3vVM), with the existing custom “Meet Shri” artwork as its cover.

The public YouTube link is configured in `showreelUrl` in `js/play-config.js`. Clicking the cover loads a privacy-enhanced YouTube embed in the same space. Nothing loads from YouTube for the showreel before someone clicks. The embedded player keeps its native controls; starting it pauses the background playlist. A direct YouTube link is available when JavaScript is disabled.

Music waits for YouTube to return the playlist before selecting a random opening track. It excludes the previous opener when there is more than one video, remembers the video ID locally, and shuffles the remaining order after playback starts. Pause/resume retains the current song. A new page visit chooses a fresh opener. Playback stays opt-in and starts at 5% volume. A restricted browser storage setting does not prevent playback.

The refinement keeps the actual project images, testimonials, project links, visitor board, games, and Indian palette. Public copy is shorter and more specific, typography is more consistent, product previews have fewer decorative frames, and textile textures sit quietly behind the content. Open Graph and Twitter descriptions now focus on product design, design systems, and independent builds. The existing 1200×630 portrait preview remains the social image.

## Verification

- The configured video played through in the browser. The custom cover returns on reload, with no showreel iframe loaded before clicking. All three showreel tests pass.
- 47 automated tests pass, including playlist selection, delayed playlist loading, unavailable storage, pause/resume, cancellation, and click-to-load showreel behaviour.
- Live YouTube playback started on “Badukina Bannave” and then “Seedhe Maut - TT / Shutdown” on consecutive page visits, with shuffle enabled and 5% volume.
- Responsive layouts reviewed at 320, 390, and 768 pixels, alongside the desktop preview. The mobile game launcher is now a compact corner button.
- The desktop light-theme axe scan reported no automated violations. Texture backgrounds require manual contrast review. Narrow Fit-mode canvas views flagged overlapping marks in existing visitor-arranged positions; their content and saved positions were preserved. Zoom and keyboard navigation remain available. This is a review of the changes, not a WCAG certification.
