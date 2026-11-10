// Composes one image prompt per project from a shared template, so every cover follows the same system.
// Run: node tools/build_cover_prompts.mjs > prompts.json
// Generate each prompt at 3:2 (the set was made with GPT Image 2.5 Sunburst at 1536x1024), save the PNG as
// assets/_src/covers/<slug>.png, then run: sh tools/convert_covers.sh assets/_src/covers assets/covers
// The slug is the case-study slug: `slug` for design work, `caseSlug` for built products in js/site-data.js.

const GROUNDS = {
  turmeric: { bg: 'turmeric yellow (#F2B705)', name: 'kohl black (#1B1A17)', line: 'kohl black', rays: 'kohl-black' },
  teal:     { bg: 'peacock teal (#0E7C7B)',    name: 'warm cream (#F3ECDF)',  line: 'cream',      rays: 'cream' },
  green:    { bg: 'bottle green (#1E5B3A)',    name: 'turmeric yellow (#F2B705)', line: 'cream',  rays: 'turmeric-yellow' },
  sindoor:  { bg: 'sindoor red (#C8281E)',     name: 'warm cream (#F3ECDF)',  line: 'cream',      rays: 'turmeric-yellow' },
  indigo:   { bg: 'deep indigo (#23357A)',     name: 'turmeric yellow (#F2B705)', line: 'cream',  rays: 'cream' },
  marigold: { bg: 'marigold orange (#EF6C1A)', name: 'kohl black (#1B1A17)',  line: 'kohl black', rays: 'cream' },
  lotus:    { bg: 'lotus pink (#E5527A)',      name: 'warm cream (#F3ECDF)',  line: 'cream',      rays: 'deep wine' },
  ivory:    { bg: 'warm ivory (#F3ECDF)',      name: 'sindoor red (#C8281E)', line: 'kohl black', rays: 'kohl-black' },
  kohl:     { bg: 'kohl black (#1B1A17)',      name: 'turmeric yellow (#F2B705)', line: 'cream',  rays: 'cream' },
  wine:     { bg: 'deep wine (#532D3A)',       name: 'warm cream (#F3ECDF)',  line: 'cream',      rays: 'marigold-orange' },
};

const DEVICES = {
  phone:   'a modern smartphone standing upright',
  laptop:  'a modern open laptop seen front-on',
  desktop: 'a modern desktop computer monitor with a slim keyboard in front of it',
  tablet:  'a modern tablet standing upright in landscape orientation',
};

// slug, name (exact lettering), line (exact, uppercase), ground, device, screen, prop
const P = [
  // Design work
  ['onespace', 'OneSpace', 'CLASS FILES AND ANNOUNCEMENTS IN ONE PLACE', 'indigo', 'phone',
    'a class app home screen: a search bar at the top and three large tiles labelled "Files", "Announcements" and "Class chat"',
    'a stack of school notebooks tied with string and a small brass school bell'],
  ['umatter', 'uMatter', 'FIND AND BOOK PROFESSIONAL SUPPORT', 'lotus', 'phone',
    'a booking screen: a row of three round expert avatars drawn as plain grey silhouette icons, a small month calendar with one date circled, and a button labelled "Book session"',
    'a glass of chai on a saucer and one marigold flower'],
  ['mucoin', 'MuCoin', 'INCOME, EXPENSES AND SAVINGS IN ONE VIEW', 'green', 'phone',
    'a simple money overview: one donut chart at the top and three rows beneath it labelled "Income", "Expenses" and "Savings goal", each with a coloured progress bar',
    'a round terracotta Indian gullak clay piggy bank with brass coins dropping into its slot'],
  ['gmd', 'GetMetaData', 'PAGE METADATA, EASY TO FIND', 'marigold', 'laptop',
    'a web browser window with a small extension popup panel open at the top right, listing page details in four rows labelled "Title", "Description", "Author" and "Keywords"',
    'a brass magnifying glass and two blank paper luggage tags on string'],
  ['steve-wilson', 'Steve Wilson', 'A PORTFOLIO BUILT ON TYPOGRAPHY', 'ivory', 'laptop',
    'a minimal black-and-white portfolio homepage dominated by very large serif letterforms "Aa" and a thin line of navigation links',
    'a handful of wooden letterpress type blocks'],
  ['gloria-furniture', 'Gloria Furniture', 'A STOREFRONT FOR FURNITURE AND HOME', 'teal', 'laptop',
    'an online furniture shop page: a large photo of an armchair, a row of three product cards showing a chair, a lamp and a table, and a button labelled "Shop collection"',
    'a cane-and-teak planter\'s armchair'],
  ['fun-cruises', 'Fun Cruises Goa', 'FIND A BOAT, SEND AN ENQUIRY', 'indigo', 'laptop',
    'a cruise landing page: a wide photo of a river cruise boat at sunset, a row of three boat cards, and a button labelled "Enquire now"',
    'a white river cruise boat with a string of bunting flags and one coconut palm'],
  ['bni-website', 'BNI Goa', "A NEW WEBSITE FOR GOA'S BUSINESS NETWORK", 'sindoor', 'laptop',
    'a business-network homepage: the heading "Grow your business", a row of three large member statistics, and a button labelled "Visit a chapter"',
    'a neat stack of blank visiting cards and a brass desk bell'],
  ['irctc', 'IRCTC', 'TRAIN BOOKING, REDESIGNED', 'turmeric', 'laptop',
    'a simple train-ticket search page: the heading "Book your train", two input fields labelled "From" and "To", a date field, and one large red button labelled "Search trains", with a small train icon',
    'a vintage Indian Railways diesel locomotive seen head-on, placed behind the laptop and partly hidden by it, and one red cardboard railway ticket stub tucked at an angle'],
  ['nityananda', 'Nitya Nanda', 'A PHOTOGRAPHY PORTFOLIO LED BY IMAGES', 'kohl', 'laptop',
    'a photographer\'s portfolio page: an edge-to-edge grid of six photographs of landscapes and street scenes without people, and a small thin navigation bar',
    'a vintage twin-lens reflex camera and a short strip of film negatives'],

  // Built products
  ['halo', 'Halo', 'SHORTCUT RING FOR YOUR DESKTOP', 'teal', 'desktop',
    'a radial shortcut menu on a pale background: eight round white buttons arranged evenly in a circle around one central round grey close button, each button holding one simple dark icon (padlock, screenshot frame, pencil, play-pause, sparkle, split window, folder, plus sign), with a mouse pointer on one button that is highlighted with a bright blue ring',
    'a computer mouse'],
  ['binnder', 'Binnder', 'REVIEW FILES: KEEP, BIN OR DELETE', 'marigold', 'phone',
    'a file review screen: one large photo preview card at the top and three round buttons in a row beneath it labelled "Keep", "Delete forever" and "Bin"',
    'a small steel wastepaper bin with crumpled paper and a few loose photo prints'],
  ['pureeq', 'PureEQ', 'SOUND TUNED TO EACH EAR', 'indigo', 'phone',
    'an equaliser screen: a row of eight vertical sliders forming a smooth curve, and two tabs at the top labelled "Left ear" and "Right ear"',
    'a pair of over-ear headphones'],
  ['hidden-identity-chess', 'Hidden Identity Chess', 'CHESS WHERE PIECES HIDE WHO THEY ARE', 'wine', 'tablet',
    'a chess board seen from above where most pieces are plain round tokens marked with a question mark, two pieces are revealed as a knight and a rook, and a button is labelled "Challenge"',
    'a wooden chess knight wearing a small black masquerade mask'],
  ['five-dead', '5 Dead', 'A CARD GAME AROUND A RUNNING TOTAL', 'sindoor', 'tablet',
    'a card game table: a fan of five playing cards along the bottom, a discard pile in the middle and a very large running total number "17" at the top',
    'a few scattered vintage playing cards'],
  ['alibi', 'Alibi', 'A PARTY GAME OF CLIPS, CLUES AND VOTES', 'turmeric', 'phone',
    'a party game screen: a video clip thumbnail with a play button, a text field labelled "Your one-word clue", and a row of four round player chips above a button labelled "Vote"',
    'a film clapperboard and a detective\'s magnifying glass'],
  ['forma', 'Forma', 'ACTIVITY, SLEEP AND HEALTH TRENDS', 'green', 'phone',
    'a health dashboard: three concentric coloured activity rings, a seven-bar sleep chart for the week, and a large score "82"',
    'a smartwatch and a pair of running shoes'],
  ['ohcaptain', 'OhCaptain', 'A THREE-A-SIDE NAVAL STRATEGY GAME', 'indigo', 'laptop',
    'a top-down naval battle map: blue sea, a red fleet of three ships facing a blue fleet of three ships, and eight round relay markers numbered 1 to 8',
    'a brass ship\'s wheel and a captain\'s cap'],
  ['office-games', 'The Office Games', 'MULTIPLAYER GAMES FOR OFFICE BREAKS', 'lotus', 'laptop',
    'a game lobby: three large game tiles labelled "Trivia", "Draw it" and "Scramble", and a row of four round player badges with coloured initials',
    'a coffee mug and a handful of paper party streamers'],
  ['dashf1', 'DashF1', 'LIVE RACE DATA AND STANDINGS', 'kohl', 'laptop',
    'a dark motor-racing dashboard: a live timing table of driver positions 1 to 6 with coloured team bars and lap times, beside a small outline map of a race circuit',
    'a motor-racing helmet and a chequered flag'],
  ['hexchess', 'HexChess', 'CHESS ON A HEXAGONAL BOARD', 'marigold', 'tablet',
    'a hexagonal chess board made of hexagon cells in three shades of brown, with black and white chess pieces set up on it',
    'a wooden chess king and queen'],
  ['hued', 'Hued', 'ONE COLOUR A DAY. FIND IT. SHOOT IT.', 'ivory', 'phone',
    'a camera screen: a large orange colour swatch labelled "Today: Marigold", a round shutter button, and a small grid of six photos that are all orange in hue',
    'three small heaps of bright gulal colour powder in pink, yellow and blue'],
  ['arkitype', 'Arkitype', 'BUILD A DESIGN SYSTEM IN THE BROWSER', 'teal', 'laptop',
    'a design-system builder: a left sidebar of colour swatches and type sizes, and a canvas showing a tidy grid of interface components (buttons, text inputs, toggles and cards) that all share one accent colour',
    'three hand-carved wooden textile printing blocks'],
  ['yuva-panaji', 'Yuva Panaji', 'EVENTS AND SIGN-UPS FOR A COMMUNITY', 'sindoor', 'laptop',
    'a community events page: a list of three upcoming events with date badges, a button labelled "Register" on each, and a small attendance counter',
    'a horn loudspeaker and a string of marigold garland'],
  ['matinee', 'Matinee', 'FIND YOUR NEXT FILM OR SERIES', 'wine', 'phone',
    'a film-finder screen: one large abstract film poster card without faces, a five-star rating beneath it, and two round buttons labelled "Skip" and "Watchlist"',
    'a film reel and two paper cinema tickets'],
  ['birthsky', 'BirthSky', 'THE SKY ON THE DAY YOU WERE BORN', 'indigo', 'laptop',
    'a dark star map: a circular chart of the night sky with constellations drawn as thin lines, and a date field showing a birth date',
    'a brass astrolabe'],
  ['the-blog', 'The Blog', 'POEMS, ESSAYS AND FICTION', 'ivory', 'laptop',
    'a clean blog homepage: a serif masthead and a list of three posts tagged "Poem", "Essay" and "Fiction"',
    'a fountain pen, a glass inkpot and a blue Indian inland letter'],
  ['premoney', 'PreMoney', 'SPENDING TRACKED FROM YOUR BANK SMS', 'green', 'phone',
    'a spending tracker: three bank text-message bubbles at the top flowing into a list of three expense rows with rupee amounts, and a monthly total',
    'a red cloth-bound Indian bahi-khata ledger book tied with string'],
  ['vansh-vriksha', 'Vansh Vriksha', 'A COMMUNITY ARCHIVE OF FAMILY TREES', 'turmeric', 'laptop',
    'a family tree diagram: round nodes joined by lines across four generations, with a side panel listing "Village", "Deity" and "Lineage"',
    'a banyan tree with hanging aerial roots'],
  ['earthlog', 'Earthlog', 'EARTHQUAKES, WEATHER AND ECLIPSES ON A GLOBE', 'teal', 'laptop',
    'a globe of the Earth on a dark background with glowing dots for earthquakes and a curved orbit line for a space station, beside a small panel listing "Earthquakes", "Weather", "ISS" and "Eclipses"',
    'a school desk globe on a wooden stand'],
  ['deckforge', 'DeckForge', 'EDIT AND ANIMATE PDF DECKS', 'lotus', 'laptop',
    'a slide editor: one presentation slide in the centre with a selected text box showing resize handles, a strip of slide thumbnails down the left and an animation timeline along the bottom',
    'a vintage slide projector'],
  ['planit', 'PlanIt', 'ONE SHARED PLAN FOR GROUP TRIPS', 'marigold', 'laptop',
    'a trip planner split into three panels: a board of task cards, a horizontal timeline, and a map with a dotted route between three pins',
    'a leather suitcase covered in travel stickers and a folded paper map'],
  ['scalesee', 'ScaleSee', 'TWO QUANTITIES, DRAWN TO SCALE', 'wine', 'laptop',
    'two circles side by side drawn to scale, a small one labelled "Earth" and a far larger one labelled "Jupiter", with the ratio "11×" between them',
    'a brass Indian balance scale with two hanging pans'],
  ['where-would-i-be', 'Where Would I Be…?', 'YOUR LOCATION THROUGH GEOLOGICAL TIME', 'kohl', 'laptop',
    'a globe showing ancient continents joined into one landmass, a red location pin, and a timeline slider labelled "200 million years ago"',
    'an ammonite fossil and a brass compass'],
  ['soundbox', 'SoundBox', 'A PIANO TUTOR THAT LISTENS', 'sindoor', 'tablet',
    'a piano lesson: coloured note bars falling towards an on-screen piano keyboard, one key highlighted green, and a small microphone icon showing that the app is listening',
    'an Indian harmonium'],
  ['wheelie', 'Wheelie', 'GROUP RIDES WITH LIVE MAP AND VOICE', 'turmeric', 'phone',
    'a ride map: a winding route line, four round rider markers along it, a meeting-point pin, and a large round microphone button for voice chat',
    'a classic motorcycle and a rider\'s helmet with goggles'],
  ['applecider', 'AppleCider', 'SKETCH INTERFACES WITH HAND-DRAWN PARTS', 'green', 'laptop',
    'a wireframe sketching tool: a canvas with a pencil-style hand-drawn wireframe of an app screen (wobbly boxes, buttons and an image placeholder with a cross) and a sidebar of sketchy components',
    'a red apple, a yellow pencil and a few pencil shavings'],
];

const prompts = P.map(([slug, name, line, ground, device, screen, prop]) => {
  const g = GROUNDS[ground];
  const prompt =
    `A 3:2 landscape project cover designed as a clean contemporary editorial collage, inspired by vintage Indian print ephemera (matchbox labels, hand-painted film posters, bazaar trade labels). ` +
    `Background: one flat saturated ${g.bg} filling the frame edge to edge, with fine paper grain, slight offset-print misregistration and one or two faint fold creases. ` +
    `Hero, filling the right two-thirds: ${DEVICES[device]}, a realistic black-and-white halftone photograph treated as a paper cut-out with a thin white cut edge and a soft drop shadow. ` +
    `Its screen is in full flat colour and clearly shows ${screen}. ` +
    `Next to the device, as a second paper cut-out: ${prop}. ` +
    `Behind the hero, a simple sunburst of thin ${g.rays} rays. ` +
    `Lettering stacked on the left third: the name "${name}" in large bold hand-painted poster lettering in ${g.name}; directly beneath it, in small clean uppercase sans-serif ${g.line} letters, the line "${line}". ` +
    `Generous empty space, strong hierarchy, crisp, modern, uncluttered, readable at thumbnail size. ` +
    `The only text in the image is the name, that one line and the short labels on the screen, all spelled exactly as given. ` +
    `No people, no faces, no brand logos, no watermark, no border or frame.`;
  return { slug, name, line, ground, prompt };
});

console.log(JSON.stringify(prompts, null, 1));
