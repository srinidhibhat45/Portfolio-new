# Portfolio preview and visitor board

Run `npm start` (or `python3 tools/serve_portfolio.py`). The site is at
`http://localhost:8000`. The visitor board persists in `.local/visitor-notes.sqlite3`;
keep this file to preserve local contributions. The preview only serves public assets.

The hosted site uses `netlify/functions/notes.mjs` and Netlify Blobs for shared notes.
Netlify installs the dependency from `package-lock.json` and supplies storage credentials
inside the Function. The local and hosted boards have separate data. No deployment or
production storage changes are performed by running the preview.

Written notes are limited to 240 characters. Doodles are stored as bounded points,
never executable SVG. Posting has a short rate limit. All notes are public.
The board displays the latest 80 contributions plus Srinidhi's welcome note.

Run `npm test` for the hosted payload validator and
`python3 tests/test_local_board.py` for API persistence, validation, origin checks,
and rate limits against a disposable database.

The brain graph uses the existing projects in `js/site-data.js` and explicitly curated
connections in `js/brain-data.js`. Update those connections as interests and work evolve.


## Private playroom

All six games run entirely in the browser. `js/game-save.mjs` saves snapshots to
IndexedDB (`shri-private-playroom`, object store `saves`). A synchronous localStorage
recovery snapshot protects a move if the visitor refreshes before the database
transaction completes. Neither store is sent to the notes API or any other server.
The newest snapshot restores board positions, pending turns, hands, scores, and
already-awarded tokens. Clearing this site's browser storage removes progress;
a different browser profile or device starts its own games.

The chess engine uses a shallow tactical search with occasional near-best moves.
Its “casual ~1100” label is a strength target, not a measured tournament rating.
Hand Cricket uses one wicket and six balls per innings; the visitor bats first.
Stone–Paper–Scissors is first to three. Both commit the bot choice before the
visitor chooses. Ultimate XO uses the standard destination-board rule.

The playlist is opt-in, starts at 5% volume, and pauses when the page is hidden
or a dialog opens. Both player sizes keep the YouTube video visible while playing.
The compact header's minimize button pauses playback and collapses the preview.
