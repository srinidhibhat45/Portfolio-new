/* ============================================================
   SITE DATA — add new work, vibe-coded projects, or posters HERE.
   No HTML/CSS/JS editing needed for any of the three lists below.
   Just add a new object to the right array and save — main.js
   renders the cards/posters from this file automatically.
   ============================================================

   ---- 1) WORK (UI/UX case studies, backed by a PDF) ----
   Adding a new one by hand:
     { slug: "unique-id", title: "Project Name", tags: "Category · Subcategory",
       blurb: "One sentence describing the project.",
       thumb: "assets/work/yourimage.png", pdf: "assets/pdfs/yourfile.pdf" }
   Optional field: prototypeUrl — a link to a live Figma/other prototype.
     Only add it if the project has a real interactive prototype to link to;
     it shows up as an accessible "View Prototype ↗" link inside the case
     viewer. Leave it out entirely if there isn't one.
   The full in-page viewer (the "tap to see every screen" experience) needs
   more than this — each PDF page rendered to an image. That heavy part is
   generated, not hand-written: run
       python3 tools/add_case_study.py assets/pdfs/yourfile.pdf your-slug --layout deck
   which rasterizes the PDF into js/cases-data.js (auto-detects any embedded
   prototype link too — see tools/README.md). Do that BEFORE adding the
   entry below, using the same slug in both places.

   ---- 2) VIBE (working products with case-study reading paths) ----
   Add an object for the live product; caseSlug connects its authored story:
     { path: "~/projects/yourapp", status: "live" | "building",
       cmd: "npm run dev", name: "App Name", desc: "One sentence.",
       stack: ["Tech", "Another Tech"], href: "https://yourapp.com",
       cta: "Go look" }

   ---- 3) POSTERS (Craft Wall marquee) ----
   Just add an object — drop the image into assets/gallery/ first:
     { src: "assets/gallery/yourimage.jpg", alt: "Short description" }
   `row` is optional (1, 2, or 3) — picks which of the three scrolling rows
   it lands in. Leave it out and it's assigned automatically.
   ============================================================ */
window.SITE_DATA = {

  work: [
    { slug: "onespace", title: "OneSpace", tags: "Product Design · Ed-tech",
      blurb: "Making class communication, files, and announcements easier to find.",
      thumb: "assets/work/onespace.png", pdf: "assets/pdfs/onespace.pdf" },

    { slug: "umatter", title: "uMatter", tags: "Mobile App · Design Challenge",
      blurb: "A 14-hour team concept for finding and booking professional support.",
      thumb: "assets/work/umatter.png", pdf: "assets/pdfs/umatter.pdf" },

    { slug: "mucoin", title: "MuCoin", tags: "Fintech · Onboarding UX",
      blurb: "A reviewable starting picture of income, expenses, and savings goals.",
      thumb: "assets/work/mucoin.png", pdf: "assets/pdfs/mucoin.pdf",
      prototypeUrl: "https://www.figma.com/proto/fTSm9Chs0awMrjMUN2OWSa/MuCoin?node-id=1-2&starting-point-node-id=191%3A955&t=z97O9d2NsQAgujdk-1" },

    { slug: "gmd", title: "GetMetaData", tags: "Web Extension · Material UI",
      blurb: "Page metadata, easier to find and review.",
      thumb: "assets/work/gmd.png", pdf: "assets/pdfs/gmd.pdf",
      prototypeUrl: "https://www.figma.com/proto/P86VsJJUoQDMzxsUFCnRHo/3MMaven-Project?node-id=8-2&starting-point-node-id=8%3A2&t=K4zjIkNOs7p8WSiR-1" },

    { slug: "steve-wilson", title: "Steve Wilson", tags: "Portfolio · Minimal Concept",
      blurb: "A portfolio concept built around typography.",
      thumb: "assets/work/swportfolio.png", pdf: "assets/pdfs/steve-wilson.pdf" },

    { slug: "gloria-furniture", title: "Gloria Furniture", tags: "Landing Page · E-commerce",
      blurb: "A storefront concept for furniture and home collections.",
      thumb: "assets/work/gloriafurniture.png", pdf: "assets/pdfs/gloria-furniture.pdf" },

    { slug: "fun-cruises", title: "Fun Cruises Goa", tags: "Landing Page · Redesign",
      blurb: "A fleet-discovery and enquiry concept for a Goan cruise business.",
      thumb: "assets/work/funcruises.png", pdf: "assets/pdfs/fun-cruises.pdf" },

    { slug: "bni-website", title: "BNI Goa", tags: "Landing Page · Redesign",
      blurb: "A new web presence for Goa’s business network.",
      thumb: "assets/work/bniwebsite.png", pdf: "assets/pdfs/bni-website.pdf" },

    { slug: "irctc", title: "IRCTC", tags: "Landing Page · Redesign",
      blurb: "Rethinking the train-booking experience.",
      thumb: "assets/work/irctc.png", pdf: "assets/pdfs/irctc.pdf" },

    { slug: "nityananda", title: "Nitya Nanda", tags: "Photographer Portfolio · Concept",
      blurb: "A photography portfolio led by the images.",
      thumb: "assets/work/nityananda.png", pdf: "assets/pdfs/nityananda.pdf" }
  ],

  vibe: [
    {"path": "~/projects/halo", "status": "building", "cmd": "", "name": "Halo", "caseSlug": "halo", "desc": "A desktop action ring for frequently used shortcuts, with app-specific layouts and a visual editor.", "stack": ["Desktop utility", "macOS & Windows"], "href": "https://github.com/srinidhibhat45/Halo", "cta": "View Halo on GitHub"},
    {"path": "~/projects/binnder", "status": "building", "cmd": "", "name": "Binnder", "caseSlug": "binnder", "desc": "A native Android file-review app that combines large previews with explicit keep, bin and permanent-delete actions.", "stack": ["Android", "File review"], "href": "https://github.com/srinidhibhat45/Binnder", "cta": "View Binnder on GitHub"},
    {"path": "~/projects/pureeq", "status": "live", "cmd": "", "name": "PureEQ", "caseSlug": "pureeq", "desc": "An Android sound-tuning app that combines a per-ear listening check, music preferences and editable EQ profiles.", "stack": ["Android", "Audio profiles"], "href": "https://github.com/srinidhibhat45/PureEQ", "cta": "View PureEQ on GitHub"},
    {"path": "~/projects/hidden-identity-chess", "status": "live", "cmd": "", "name": "Hidden Identity Chess", "caseSlug": "hidden-identity-chess", "desc": "A digital adaptation of Hidden Identity Chess, with private setup, bluffing, challenges and a focused play surface.", "stack": ["Browser game", "Hidden information"], "href": "https://hidden-identity-chess-club.soundmite3.chatgpt.site/game/", "cta": "Play Hidden Identity Chess"},
    {"path": "~/projects/five-dead", "status": "live", "cmd": "", "name": "5 Dead", "caseSlug": "five-dead", "desc": "An independent digital card game with bot play, shared-device turns and online rooms, built around a visible running total and card actions.", "stack": ["Card game", "Offline & online"], "href": "https://github.com/srinidhibhat45/5Dead", "cta": "View 5 Dead on GitHub"},
    {"path": "~/projects/alibi", "status": "live", "cmd": "", "name": "Alibi", "caseSlug": "alibi", "desc": "A social video-imposter game that takes a group through private clips, one-word clues, discussion, voting and a reveal.", "stack": ["Browser game", "Social deduction"], "href": "https://github.com/srinidhibhat45/VideoImposter", "cta": "View Alibi on GitHub"},

    { path: "~/projects/forma", status: "live", cmd: "./gradlew :app:assembleRelease",
      name: "Forma", caseSlug: "forma", desc: "Activity, sleep, and personal health trends in a native Android app, with sources and score explanations in view.",
      stack: ["Android", "Health Connect", "Wear OS"], href: "https://github.com/srinidhibhat45/forma/releases/latest", cta: "Get Forma for Android" },

    { path: "~/projects/ohcaptain", status: "building", cmd: "npm run dev",
      name: "OhCaptain", caseSlug: "ohcaptain", desc: "A 3-v-3 naval game with captains, operators, shared supplies, and eight relays to hold. Solo AI or crew rooms.",
      stack: ["Browser game", "3D", "Peer-to-peer rooms"], href: "https://github.com/srinidhibhat45/OhCaptain", cta: "View the game on GitHub" },

    { path: "~/projects/officegames", status: "live", cmd: "vercel --prod",
      name: "The Office Games", caseSlug: "office-games", desc: "Trivia, drawing games, and scrambled keyboards for multiplayer office breaks.",
      stack: ["React", "Multiplayer"], href: "https://officegames.srinidhibhat.com/", cta: "Start playing" },

    { path: "~/projects/dashf1", status: "live", cmd: "npm run dev",
      name: "DashF1", caseSlug: "dashf1", desc: "Live Formula 1 race data, standings, and driver statistics.",
      stack: ["React", "Tailwind", "Live Data API"], href: "https://f1dash.srinidhibhat.com/", cta: "Open dashboard" },

    { path: "~/projects/hexchess", status: "live", cmd: "npm run dev",
      name: "HexChess", caseSlug: "hexchess", desc: "Hexagonal chess on 91 cells. Play the computer or a friend, with a tutorial to learn the rules.",
      stack: ["Web app", "Offline play"], href: "https://hexchess.srinidhibhat.com/", cta: "Play HexChess" },

    { path: "~/projects/hued", status: "live", cmd: "npx expo start",
      name: "Hued", caseSlug: "hued", desc: "One colour a day. Find it, photograph it.",
      stack: ["React Native", "Expo", "Supabase"], href: "https://hued.srinidhibhat.com/", cta: "Open the app" },

    { path: "~/projects/arkitype", status: "building", cmd: "npm run dev --port 3111",
      name: "Arkitype", caseSlug: "arkitype", desc: "Build a design system in the browser, with 90 components and connected design tokens.",
      stack: ["Next.js", "Zustand", "Tailwind"], href: "https://arkitype.srinidhibhat.com/", cta: "Try the studio" },

    { path: "~/projects/yuva-website", status: "live", cmd: "node scripts/build-db.js",
      name: "Yuva Panaji", caseSlug: "yuva-panaji", desc: "A community website and operations portal for events, registration, and committee workflows.",
      stack: ["Next.js", "Supabase", "Event operations"], href: "https://yuva-website.netlify.app/", cta: "See the site" },

    { path: "~/projects/matinee", status: "live", cmd: "netlify deploy --prod",
      name: "Matinee", caseSlug: "matinee", desc: "Find your next film or series.",
      stack: ["React Native", "Expo", "TMDB API"], href: "https://matinee.srinidhibhat.com/", cta: "Browse films" },

    { path: "~/projects/birthsky", status: "live", cmd: "npx serve",
      name: "BirthSky", caseSlug: "birthsky", desc: "The sky at the moment you were born, mapped in your browser.",
      stack: ["Vanilla JS", "Canvas"], href: "https://birthsky.srinidhibhat.com/", cta: "Check your sky" },

    { path: "~/projects/blogs", status: "live", cmd: "npm run build",
      name: "The Blog", caseSlug: "the-blog", desc: "Poems, essays, fiction, and a written podcast under the name अvinash.",
      stack: ["Astro"], href: "https://blogs.srinidhibhat.com/", cta: "Start reading" },

    { path: "~/projects/premoney", status: "live", cmd: "flutter run --release",
      name: "PreMoney", caseSlug: "premoney", desc: "Spending and savings, tracked from SMS transactions.",
      stack: ["Flutter", "Dart"], href: "https://github.com/srinidhibhat45/PreMoney-releases", cta: "Get the app" },

    { path: "~/projects/vansh-vriksha", status: "live", cmd: "npm run build",
      name: "Vansh Vriksha", caseSlug: "vansh-vriksha", desc: "A free community genealogy archive linking families, villages, deities, and lineage names.",
      stack: ["Next.js", "Graph model", "Versioned records"], href: "https://vanshvriksha.srinidhibhat.com/", cta: "Explore the archive" },

    { path: "~/projects/earthlog", status: "live", cmd: "node serve.mjs",
      name: "Earthlog", caseSlug: "earthlog", desc: "Earthquakes, weather, ISS passes, and eclipses on an interactive globe.",
      stack: ["Vanilla JS", "MapLibre GL"], href: "https://earthlog.srinidhibhat.com/", cta: "Explore the globe" },

    { path: "~/projects/deckforge", status: "live", cmd: "npm run dev",
      name: "DeckForge", caseSlug: "deckforge", desc: "Edit text, logos, and shapes from PDF decks, then animate them. Runs entirely on your device.",
      stack: ["React", "TypeScript", "PDF.js"], href: "https://deckforge.srinidhibhat.com/", cta: "Edit a deck" },

    { path: "~/projects/planit", status: "live", cmd: "npm run dev",
      name: "PlanIt", caseSlug: "planit", desc: "A shared plan across boards, timelines, and maps for group trips across time zones. No account or server needed.",
      stack: ["React", "TypeScript", "Leaflet"], href: "https://planit.srinidhibhat.com/", cta: "Plan a trip" },

    { path: "~/projects/scalesee", status: "live", cmd: "node serve.js",
      name: "ScaleSee", caseSlug: "scalesee", desc: "Compare two quantities side by side, drawn to scale.",
      stack: ["Vanilla JS", "SVG"], href: "https://scalesee.srinidhibhat.com/", cta: "See the scale" },

    { path: "~/projects/wherewouldibe", status: "live", cmd: "npx serve",
      name: "Where Would I Be\u2026?", caseSlug: "where-would-i-be", desc: "Follow your location through geological time as Earth’s tectonic plates move.",
      stack: ["Vanilla JS", "Three.js"], href: "https://wherewouldibe.srinidhibhat.com/", cta: "Explore the map" },

    { path: "~/projects/soundbox", status: "live", cmd: "npx cap run android",
      name: "SoundBox", caseSlug: "soundbox", desc: "Learn piano with an app that listens and waits for you to play the right notes.",
      stack: ["React", "Capacitor", "TensorFlow.js"], href: "https://github.com/srinidhibhat45/soundbox", cta: "Get the app" },

    { path: "~/projects/wheelie", status: "building", cmd: "flutter run --release",
      name: "Wheelie", caseSlug: "wheelie", desc: "Live group rides, shared meeting points, and voice chat for helmet headsets.",
      stack: ["Flutter", "Supabase", "WebRTC"], href: "https://github.com/srinidhibhat45/wheelie", cta: "See the build" },

    { path: "~/projects/applecider", status: "live", cmd: "npm run dev",
      name: "AppleCider", caseSlug: "applecider", desc: "Sketch early interfaces with 250 hand-drawn components.",
      stack: ["React", "TypeScript", "Zustand"], href: "https://applecider.srinidhibhat.com/", cta: "Start sketching" }
  ],

  posters: [
    { src: "assets/gallery/poster11.jpg", alt: "Poster", row: 1 },
    { src: "assets/gallery/poster1.jpg", alt: "Shri's Podcast", row: 1 },
    { src: "assets/gallery/logo1.png", alt: "Logo", row: 1 },
    { src: "assets/gallery/poster3.jpg", alt: "Poster", row: 1 },
    { src: "assets/gallery/poster5.jpg", alt: "Poster", row: 1 },
    { src: "assets/gallery/minimal2.jpg", alt: "Minimal art", row: 1 },
    { src: "assets/gallery/logo2.png", alt: "Logo", row: 1 },
    { src: "assets/gallery/poster12.jpg", alt: "Poster", row: 1 },
    { src: "assets/gallery/logo5.jpg", alt: "Logo", row: 1 },

    { src: "assets/gallery/poster7.jpg", alt: "Poster", row: 2 },
    { src: "assets/gallery/poster9.jpg", alt: "Poster", row: 2 },
    { src: "assets/gallery/logo9.jpg", alt: "Logo", row: 2 },
    { src: "assets/gallery/minimal1.jpg", alt: "Minimal art", row: 2 },
    { src: "assets/gallery/poster2.jpg", alt: "Poster", row: 2 },
    { src: "assets/gallery/poster13.jpg", alt: "Poster", row: 2 },
    { src: "assets/gallery/logo10.jpg", alt: "Logo", row: 2 },
    { src: "assets/gallery/poster6.jpg", alt: "Poster", row: 2 },
    { src: "assets/gallery/logo16.jpg", alt: "Logo", row: 2 },

    { src: "assets/gallery/poster4.jpg", alt: "Poster", row: 3 },
    { src: "assets/gallery/minimal3.jpg", alt: "Minimal art", row: 3 },
    { src: "assets/gallery/poster8.jpg", alt: "Poster", row: 3 },
    { src: "assets/gallery/logo11.jpg", alt: "Logo", row: 3 },
    { src: "assets/gallery/poster10.jpg", alt: "Poster", row: 3 },
    { src: "assets/gallery/minimal4.jpg", alt: "Minimal art", row: 3 },
    { src: "assets/gallery/logo3.png", alt: "Logo", row: 3 },
    { src: "assets/gallery/logo17.jpg", alt: "Logo", row: 3 },
    { src: "assets/gallery/logo13.jpg", alt: "Logo", row: 3 }
  ]
};
