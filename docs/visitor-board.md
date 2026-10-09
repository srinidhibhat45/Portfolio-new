# Shared visitor board

The deployed board is a permanent shared guestbook, not private player state. Every visitor receives all saved notes, doodles, stickers, and their shared positions. Keep older marks available; do not add a rolling display limit or expiry.

Production uses the site-scoped `portfolio-visitor-notes` Netlify Blobs store with strong consistency. This is not a deploy-scoped store, so publishing a new site version does not replace its contents. The SDK's default listing collects every page; the notes handler returns every saved mark.

Local preview uses `.local/visitor-notes.sqlite3` and preserves it across preview restarts. This development database is separate from the production store and is excluded from publishing. Neither this change nor a normal build migrates or deletes either store.

Game progress and Jimmy preferences remain private to each player's browser.

Verification: the hosted-handler regression returns all 125 marks to multiple visitor contexts and keeps older notes movable. An isolated SQLite check also returns all 125 notes, including the oldest. No test marks were added to the real board.
