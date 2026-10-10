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

   ---- 2) VIBE (live-link side projects, no PDF, no viewer) ----
   Just add an object — no script needed, no other file to touch:
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
      blurb: "Course discovery and learning, in one place.",
      thumb: "assets/work/onespace.png", pdf: "assets/pdfs/onespace.pdf" },

    { slug: "umatter", title: "uMatter", tags: "Mobile App · Design Challenge",
      blurb: "Social support and daily inspiration for mental wellbeing.",
      thumb: "assets/work/umatter.png", pdf: "assets/pdfs/umatter.pdf" },

    { slug: "mucoin", title: "MuCoin", tags: "Fintech · Onboarding UX",
      blurb: "Guiding first-time users through crypto onboarding.",
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
      blurb: "A new website and booking flow for a Goan cruise business.",
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
    { path: "~/projects/officegames", status: "live", cmd: "vercel --prod",
      name: "The Office Games", desc: "Trivia, drawing games, and scrambled keyboards for multiplayer office breaks.",
      stack: ["React", "Multiplayer"], href: "https://officegames.srinidhibhat.com/", cta: "Start playing" },

    { path: "~/projects/dashf1", status: "live", cmd: "npm run dev",
      name: "DashF1", desc: "Live Formula 1 race data, standings, and driver statistics.",
      stack: ["React", "Tailwind", "Live Data API"], href: "https://f1dash.srinidhibhat.com/", cta: "Open dashboard" },

    { path: "~/projects/hexchess", status: "live", cmd: "npm run dev",
      name: "HexChess", desc: "Hexagonal chess on 91 cells. Play the computer or a friend, with a tutorial to learn the rules.",
      stack: ["Web app", "Offline play"], href: "https://hexchess.srinidhibhat.com/", cta: "Play HexChess" },

    { path: "~/projects/hued", status: "live", cmd: "npx expo start",
      name: "Hued", desc: "One colour a day. Find it, photograph it.",
      stack: ["React Native", "Expo", "Supabase"], href: "https://hued.srinidhibhat.com/", cta: "Open the app" },

    { path: "~/projects/arkitype", status: "building", cmd: "npm run dev --port 3111",
      name: "Arkitype", desc: "Build a design system in the browser, with 50 components and editable tokens.",
      stack: ["Next.js", "Zustand", "Tailwind"], href: "https://arkitype.srinidhibhat.com/", cta: "Try the studio" },

    { path: "~/projects/yuva-website", status: "live", cmd: "node scripts/build-db.js",
      name: "Yuva Panaji", desc: "A website and CMS for Yuva Panaji, documenting 153 community events.",
      stack: ["Next.js", "SQLite", "Decap CMS"], href: "https://yuva-website.netlify.app/", cta: "See the site" },

    { path: "~/projects/matinee", status: "live", cmd: "netlify deploy --prod",
      name: "Matinee", desc: "Find your next film or series.",
      stack: ["React", "TMDB API"], href: "https://matinee.srinidhibhat.com/", cta: "Browse films" },

    { path: "~/projects/birthsky", status: "live", cmd: "npx serve",
      name: "BirthSky", desc: "The sky at the moment you were born, mapped in your browser.",
      stack: ["Vanilla JS", "Canvas"], href: "https://birthsky.srinidhibhat.com/", cta: "Check your sky" },

    { path: "~/projects/blogs", status: "live", cmd: "npm run build",
      name: "The Blog", desc: "Poems, essays, fiction, and a written podcast under the name अvinash.",
      stack: ["Astro"], href: "https://blogs.srinidhibhat.com/", cta: "Start reading" },

    { path: "~/projects/premoney", status: "live", cmd: "flutter run --release",
      name: "PreMoney", desc: "Spending and savings, tracked from SMS transactions.",
      stack: ["Flutter", "Dart"], href: "https://github.com/srinidhibhat45/PreMoney-releases", cta: "Get the app" },

    { path: "~/projects/vansh-vriksha", status: "live", cmd: "npm run build",
      name: "Vansh Vriksha", desc: "A free community genealogy archive linking families, villages, deities, and lineage names.",
      stack: ["Next.js", "Supabase"], href: "https://vanshvriksha.srinidhibhat.com/", cta: "Explore the archive" },

    { path: "~/projects/earthlog", status: "live", cmd: "node serve.mjs",
      name: "Earthlog", desc: "Earthquakes, weather, ISS passes, and eclipses on an interactive globe.",
      stack: ["Vanilla JS", "MapLibre GL"], href: "https://earthlog.srinidhibhat.com/", cta: "Explore the globe" },

    { path: "~/projects/deckforge", status: "live", cmd: "npm run dev",
      name: "DeckForge", desc: "Edit text, logos, and shapes from PDF decks, then animate them. Runs entirely on your device.",
      stack: ["React", "TypeScript", "PDF.js"], href: "https://deckforge.srinidhibhat.com/", cta: "Edit a deck" },

    { path: "~/projects/planit", status: "live", cmd: "npm run dev",
      name: "PlanIt", desc: "Seven views for planning a group trip across time zones. No account or server needed.",
      stack: ["React", "TypeScript", "Leaflet"], href: "https://planit.srinidhibhat.com/", cta: "Plan a trip" },

    { path: "~/projects/scalesee", status: "live", cmd: "node serve.js",
      name: "ScaleSee", desc: "Compare two quantities side by side, drawn to scale.",
      stack: ["Vanilla JS", "SVG"], href: "https://scalesee.srinidhibhat.com/", cta: "See the scale" },

    { path: "~/projects/wherewouldibe", status: "live", cmd: "npx serve",
      name: "Where Would I Be\u2026?", desc: "Follow your location through geological time as Earth’s tectonic plates move.",
      stack: ["Vanilla JS", "Three.js"], href: "https://wherewouldibe.srinidhibhat.com/", cta: "Explore the map" },

    { path: "~/projects/soundbox", status: "live", cmd: "npx cap run android",
      name: "SoundBox", desc: "Learn piano with an app that listens and waits for you to play the right notes.",
      stack: ["React", "Capacitor", "TensorFlow.js"], href: "https://github.com/srinidhibhat45/soundbox", cta: "Get the app" },

    { path: "~/projects/wheelie", status: "building", cmd: "flutter run --release",
      name: "Wheelie", desc: "Live group rides, shared meeting points, and voice chat for helmet headsets.",
      stack: ["Flutter", "Supabase", "WebRTC"], href: "https://github.com/srinidhibhat45/wheelie", cta: "See the build" },

    { path: "~/projects/applecider", status: "live", cmd: "npm run dev",
      name: "AppleCider", desc: "Sketch early interfaces with 250 hand-drawn components.",
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
