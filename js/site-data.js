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
      blurb: "Turning a chaotic course catalog into something that finally makes sense.",
      thumb: "assets/work/onespace.png", pdf: "assets/pdfs/onespace.pdf" },

    { slug: "umatter", title: "uMatter", tags: "Mobile App · Design Challenge",
      blurb: "A wellness app designed to nudge, not nag.",
      thumb: "assets/work/umatter.png", pdf: "assets/pdfs/umatter.pdf" },

    { slug: "mucoin", title: "MuCoin", tags: "Fintech · Onboarding UX",
      blurb: "Getting first-time crypto users past onboarding without a cold sweat.",
      thumb: "assets/work/mucoin.png", pdf: "assets/pdfs/mucoin.pdf",
      prototypeUrl: "https://www.figma.com/proto/fTSm9Chs0awMrjMUN2OWSa/MuCoin?node-id=1-2&starting-point-node-id=191%3A955&t=z97O9d2NsQAgujdk-1" },

    { slug: "gmd", title: "GetMetaData", tags: "Web Extension · Material UI",
      blurb: "A browser extension that makes pulling page metadata feel almost fun.",
      thumb: "assets/work/gmd.png", pdf: "assets/pdfs/gmd.pdf",
      prototypeUrl: "https://www.figma.com/proto/P86VsJJUoQDMzxsUFCnRHo/3MMaven-Project?node-id=8-2&starting-point-node-id=8%3A2&t=K4zjIkNOs7p8WSiR-1" },

    { slug: "steve-wilson", title: "Steve Wilson", tags: "Portfolio · Minimal Concept",
      blurb: "A portfolio concept that trusts whitespace to do the talking.",
      thumb: "assets/work/swportfolio.png", pdf: "assets/pdfs/steve-wilson.pdf" },

    { slug: "gloria-furniture", title: "Gloria Furniture", tags: "Landing Page · E-commerce",
      blurb: "Furniture shopping that doesn't feel like assembling flat-pack instructions.",
      thumb: "assets/work/gloriafurniture.png", pdf: "assets/pdfs/gloria-furniture.pdf" },

    { slug: "fun-cruises", title: "Fun Cruises Goa", tags: "Landing Page · Redesign",
      blurb: "Turned a clunky booking flow into an actual invitation to sail.",
      thumb: "assets/work/funcruises.png", pdf: "assets/pdfs/fun-cruises.pdf" },

    { slug: "bni-website", title: "BNI Goa", tags: "Landing Page · Redesign",
      blurb: "A local business network's site, rebuilt to look like it means business.",
      thumb: "assets/work/bniwebsite.png", pdf: "assets/pdfs/bni-website.pdf" },

    { slug: "irctc", title: "IRCTC", tags: "Landing Page · Redesign",
      blurb: "Redesigning India's most-used — and most memed — booking site.",
      thumb: "assets/work/irctc.png", pdf: "assets/pdfs/irctc.pdf" },

    { slug: "nityananda", title: "Nitya Nanda", tags: "Photographer Portfolio · Concept",
      blurb: "A photographer's portfolio built to get out of the photos' way.",
      thumb: "assets/work/nityananda.png", pdf: "assets/pdfs/nityananda.pdf" }
  ],

  vibe: [
    { path: "~/projects/hued", status: "live", cmd: "npx expo start",
      name: "Hued", desc: "A daily colour-challenge app — everyone gets the same colour, you go find it and shoot it.",
      stack: ["React Native", "Expo", "Supabase"], href: "https://hued-app.netlify.app/", cta: "Open the app" },

    { path: "~/projects/arkitype", status: "building", cmd: "npm run dev --port 3111",
      name: "Arkitype", desc: "A guided design-system builder — 50 components you can re-bind to your own tokens, no Figma required.",
      stack: ["Next.js", "Zustand", "Tailwind"], href: "https://arkitype.vercel.app/", cta: "Try the studio" },

    { path: "~/projects/yuva-website", status: "live", cmd: "node scripts/build-db.js",
      name: "Yuva Panaji", desc: "A full CMS for a Goa NGO — 153 events parsed straight out of a PDF annual report.",
      stack: ["Next.js", "SQLite", "Decap CMS"], href: "https://yuva-website.netlify.app/", cta: "See the site" },

    { path: "~/projects/matinee", status: "live", cmd: "netlify deploy --prod",
      name: "Matinee", desc: "A movie & TV browser for when \"what should we watch\" turns into a 20-minute debate.",
      stack: ["React", "TMDB API"], href: "https://matinee-app.netlify.app/", cta: "Go browse" }
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
