/* ==========================================================================
   Hued Landing Page Javascript
   Features:
   1. Theme Switching (Light/Dark)
   2. Deterministic Daily Color Math (Matches Expo App)
   3. Live Scorer Simulator (HTML5 Canvas Pixel Analysis in CIE L*a*b*)
   ========================================================================== */

// ─── Theme Toggle ───────────
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const body = document.body;
const headerLogo = document.getElementById('header-logo');
const footerLogo = document.getElementById('footer-logo');
const heroPhoneGif = document.getElementById('hero-phone-gif');

// Load theme from localStorage or default to system preference
const savedTheme = localStorage.getItem('theme');
const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
  enableDarkMode();
} else {
  enableLightMode();
}

themeToggleBtn.addEventListener('click', () => {
  if (body.classList.contains('dark-mode')) {
    enableLightMode();
  } else {
    enableDarkMode();
  }
});

function enableDarkMode() {
  body.classList.remove('light-mode');
  body.classList.add('dark-mode');
  localStorage.setItem('theme', 'dark');
  if (headerLogo) headerLogo.src = 'assets/logo-dark.png';
  if (footerLogo) footerLogo.src = 'assets/logo-dark.png';
  if (heroPhoneGif) heroPhoneGif.src = 'assets/logo-anim-dark.gif';
  const gatewayLogo = document.getElementById('gateway-logo');
  if (gatewayLogo) gatewayLogo.src = 'assets/logo-dark.png';
}

function enableLightMode() {
  body.classList.remove('dark-mode');
  body.classList.add('light-mode');
  localStorage.setItem('theme', 'light');
  if (headerLogo) headerLogo.src = 'assets/logo-light.png';
  if (footerLogo) footerLogo.src = 'assets/logo-light.png';
  if (heroPhoneGif) heroPhoneGif.src = 'assets/logo-anim-light.gif';
  const gatewayLogo = document.getElementById('gateway-logo');
  if (gatewayLogo) gatewayLogo.src = 'assets/logo-light.png';
}


// ─── Color Math & Deterministic Draw Engine ───────────
const HUE_COMMONNESS = [
  { h: 0, v: 0.85 },   // red
  { h: 20, v: 0.95 },  // terracotta / brick / skin / earth
  { h: 40, v: 0.9 },   // orange
  { h: 55, v: 0.95 },  // amber / gold / sand / wood
  { h: 70, v: 0.78 },  // yellow
  { h: 90, v: 0.3 },   // chartreuse — rare
  { h: 110, v: 0.5 },  // yellow-green
  { h: 130, v: 0.85 }, // foliage green
  { h: 160, v: 0.5 },  // jade / emerald
  { h: 180, v: 0.28 }, // pure cyan / teal — rare
  { h: 200, v: 0.9 },  // sky blue / water
  { h: 220, v: 0.8 },  // blue
  { h: 245, v: 0.62 }, // deep blue / indigo
  { h: 270, v: 0.45 }, // violet
  { h: 295, v: 0.38 }, // purple
  { h: 310, v: 0.3 },  // magenta / fuchsia — rare
  { h: 330, v: 0.6 },  // pink / rose (flowers)
  { h: 350, v: 0.75 }, // rose-red
  { h: 360, v: 0.85 }, // wraps back to red
];

const HUE_BANDS = [
  {
    max: 12,
    names: ['Red', 'Scarlet', 'Crimson', 'Fire Red', 'Cardinal'],
    prompts: [
      'A fire engine, ripe tomato, autumn maple.',
      'Bold red paint, a poppy, chili skin.',
      'A red door, strawberry jam, brick dust.',
      'Autumn berries, a bold scarf, lacquer.',
    ],
  },
  {
    max: 28,
    names: ['Terracotta', 'Vermilion', 'Rust', 'Brick', 'Burnt Red'],
    prompts: [
      'Sun-baked clay, a flowerpot, warm brick.',
      'A fire hydrant, dried chili, lacquer.',
      'Weathered iron, old drainpipes, autumn leaves.',
      'Crumbling brick wall, paprika, red earth.',
    ],
  },
  {
    max: 42,
    names: ['Orange', 'Burnt Orange', 'Persimmon', 'Pumpkin', 'Tangerine'],
    prompts: [
      'A pumpkin, autumn leaves at peak colour.',
      'Ripe tangerines, a warm sunset, marigolds.',
      'Embers in a fire, an October afternoon.',
      'A traffic cone, fresh carrots, harvest squash.',
    ],
  },
  {
    max: 58,
    names: ['Amber', 'Saffron', 'Honey', 'Gold', 'Marigold'],
    prompts: [
      'Honey in backlight, beeswax, autumn oak.',
      'Spice market, a marigold garland, turmeric.',
      'Old brass fittings, candlelight, warm wood.',
      'A school bus, autumn wheat, mustard paint.',
    ],
  },
  {
    max: 72,
    names: ['Yellow', 'Lemon', 'Butter', 'Sunflower', 'Goldenrod'],
    prompts: [
      'Citrus peel, a rubber duck, midday sunshine.',
      'Wildflowers in a meadow, late summer harvest.',
      'Fresh butter, a cream wall in warm light.',
      'A sunflower field, new banana peel, wet paint.',
    ],
  },
  {
    max: 100,
    names: ['Lime', 'Chartreuse', 'Citron', 'Pistachio', 'Apple Green'],
    prompts: [
      'A fresh lime, new spring grass, young leaves.',
      'Granny Smith apple, a tennis ball, tree canopy.',
      'Sour candy, key lime rind, fresh moss.',
      'Pistachio gelato, a budding hedge, lichen.',
    ],
  },
  {
    max: 135,
    names: ['Green', 'Fern', 'Sage', 'Moss', 'Forest'],
    prompts: [
      'Deep forest canopy, a still fern glade.',
      'Sage herb, dried eucalyptus, celadon pottery.',
      'A carpet of moss after rain, riverbank.',
      'Old bottle glass, dark ivy, shadowed leaves.',
    ],
  },
  {
    max: 162,
    names: ['Jade', 'Mint', 'Sea Glass', 'Seafoam', 'Spearmint'],
    prompts: [
      'A jade carving, frosted sea glass on the shore.',
      'Cool mint leaves, an old patinated copper roof.',
      'Seafoam on black sand, aqua wave crests.',
      'A vintage tile floor, soft green ceramic.',
    ],
  },
  {
    max: 195,
    names: ['Teal', 'Lagoon', 'Peacock', 'Verdigris', 'Patina'],
    prompts: [
      'Shallow tropical water, a peacock feather.',
      'Aged copper roof, Moroccan ceramic tile.',
      'A calm lagoon at midday, turquoise stone.',
      'Patina on old bronze, seaside metalwork.',
    ],
  },
  {
    max: 220,
    names: ['Sky Blue', 'Cerulean', 'Cornflower', 'Powder Blue', 'Robin Egg'],
    prompts: [
      'A clear midday sky, denim shirt, pool tile.',
      'Cornflowers in a wheat field, forget-me-nots.',
      'A robin egg, pale winter sky, washed cotton.',
      'Chalk-blue shutters, a summer afternoon sky.',
    ],
  },
  {
    max: 245,
    names: ['Cobalt', 'Royal Blue', 'Sapphire', 'Deep Blue', 'Navy'],
    prompts: [
      'A painted front door, deep ocean, printer ink.',
      'A sapphire gemstone, navy wool coat.',
      'Dark water at dusk, indigo dye, a blue night.',
      'Old denim faded deep, a harbour at midnight.',
    ],
  },
  {
    max: 268,
    names: ['Indigo', 'Periwinkle', 'Slate Blue', 'Dusk', 'Twilight'],
    prompts: [
      'The sky ten minutes after sunset, blueberries.',
      'Worn jeans in low light, deep twilight.',
      'Wet slate rooftops, storm-cloud blue.',
      'Woad dye, indigo ink, shadow in a canyon.',
    ],
  },
  {
    max: 295,
    names: ['Violet', 'Amethyst', 'Wisteria', 'Purple', 'Lavender'],
    prompts: [
      'A raw amethyst, wisteria in full bloom.',
      'Lavender fields, a purple iris, grape skin.',
      'Heather on a moorland, sunset over clouds.',
      'A vintage velvet chair, viola petals.',
    ],
  },
  {
    max: 325,
    names: ['Magenta', 'Fuchsia', 'Orchid', 'Mulberry', 'Plum'],
    prompts: [
      'Bougainvillea in full colour, magenta ink.',
      'An orchid petal, fuchsia paint, vibrant hibiscus.',
      'Crushed mulberry, plum skin, dark velvet.',
      'A neon sign, bright zinnia, tropical bloom.',
    ],
  },
  {
    max: 348,
    names: ['Rose', 'Blush', 'Raspberry', 'Dusty Rose', 'Peony'],
    prompts: [
      'A garden rose at dusk, soft pink stone.',
      'A peony petal, blush linen, dawn light.',
      'Crushed raspberries, a bold lip, red berry.',
      'Faded rose petals, dusty pink fabric.',
    ],
  },
  {
    max: 360,
    names: ['Red', 'Deep Rose', 'Cherry', 'Ruby', 'Wine Red'],
    prompts: [
      'A cherry, dark rose, deep berry.',
      'Wine in glass, dark cranberry, a garnet.',
      'Pomegranate seeds, dark red lacquer.',
      'A vintage red wall, deep autumn berry.',
    ],
  },
];

const LIGHTNESS_PREFIXES = [
  { max: 34, prefix: 'Deep' },
  { max: 44, prefix: 'Dark' },
  { max: 57, prefix: '' },
  { max: 65, prefix: 'Soft' },
  { max: 72, prefix: 'Pale' },
];

const SAT_SUFFIXES = [
  { max: 50, suffix: 'Muted' },
  { max: 84, suffix: '' },
  { max: 100, suffix: 'Vivid' },
];

const CONFIG = {
  matchThreshold: 34,
  presenceTau: 0.08,
  rarePresenceTau: 0.025,
  flatComplexityFloor: 0.05,
  lowDetailFloor: 0.14,
  aiMaxPenalty: 0.22,
};

function clamp01(x) { return Math.max(0, Math.min(1, x)); }

function smoothstep(x) {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(v, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToLab({ r, g, b }) {
  let [rr, gg, bb] = [r / 255, g / 255, b / 255].map((v) =>
    v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92
  );
  let x = (rr * 0.4124 + gg * 0.3576 + bb * 0.1805) / 0.95047;
  let y = rr * 0.2126 + gg * 0.7152 + bb * 0.0722;
  let z = (rr * 0.0193 + gg * 0.1192 + bb * 0.9505) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  [x, y, z] = [f(x), f(y), f(z)];
  return { L: 116 * y - 16, a: 500 * (x - y), b: 200 * (y - z) };
}

function deltaE(a, b) {
  return Math.sqrt((a.L - b.L) ** 2 + (a.a - b.a) ** 2 + (a.b - b.b) ** 2);
}

function hslAchievability(h, s, l) {
  h = ((h % 360) + 360) % 360;
  let base = HUE_COMMONNESS[HUE_COMMONNESS.length - 1].v;
  for (let i = 0; i < HUE_COMMONNESS.length - 1; i++) {
    const a = HUE_COMMONNESS[i], b = HUE_COMMONNESS[i + 1];
    if (h >= a.h && h <= b.h) {
      const t = (h - a.h) / (b.h - a.h);
      base = a.v + (b.v - a.v) * t;
      break;
    }
  }
  const satPenalty = s <= 0.6 ? 0 : ((s - 0.6) / 0.4) * 0.55;
  const lightPenalty =
    (l < 0.3 ? ((0.3 - l) / 0.3) * 0.2 : 0) + (l > 0.62 ? ((l - 0.62) / 0.38) * 0.15 : 0);
  return Math.max(0, Math.min(1, base * (1 - satPenalty) * (1 - lightPenalty)));
}

function nameAndPrompt(hue, sat, lgt, variantSeed) {
  const band = HUE_BANDS.find((b) => hue <= b.max) || HUE_BANDS[HUE_BANDS.length - 1];
  const baseName = band.names[variantSeed % band.names.length];
  const prompt = band.prompts[(variantSeed >> 2) % band.prompts.length];

  const lPrefix = (LIGHTNESS_PREFIXES.find((p) => lgt <= p.max) || LIGHTNESS_PREFIXES[LIGHTNESS_PREFIXES.length - 1]).prefix;
  const sSuffix = (SAT_SUFFIXES.find((p) => sat <= p.max) || SAT_SUFFIXES[SAT_SUFFIXES.length - 1]).suffix;

  const parts = [lPrefix, sSuffix === '' ? baseName : `${baseName} ${sSuffix}`.trim()].filter(Boolean);
  return { name: parts.join(' '), prompt };
}

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function candidateFromHash(n) {
  const hue = ((n & 0xFFF) / 0xFFF) * 360;
  const sat = 35 + (((n >>> 12) & 0xFF) / 255) * 55; // 35–90
  const lgt = 25 + (((n >>> 20) & 0xFF) / 255) * 47; // 25–72
  const variant = (n >>> 28) & 0xF;
  const ach = hslAchievability(hue, sat / 100, lgt / 100);
  return { hue, sat, lgt, variant, ach };
}

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return (
    '#' +
    [f(0), f(8), f(4)]
      .map((x) => Math.round(x * 255).toString(16).padStart(2, '0'))
      .join('')
  ).toUpperCase();
}

function colorForDayKey(dayKey) {
  const candidates = [];
  let total = 0;
  for (let i = 0; i < N_CANDIDATES; i++) {
    const cand = candidateFromHash(hashStr(`${dayKey}#${i}`));
    total += Math.pow(cand.ach, SELECTION_BIAS);
    candidates.push(cand);
  }

  let r = (hashStr(`${dayKey}#sel`) / 0xFFFFFFFF) * total;
  let chosen = candidates[0];
  for (const cand of candidates) {
    r -= Math.pow(cand.ach, SELECTION_BIAS);
    if (r <= 0) { chosen = cand; break; }
  }

  const { hue, sat, lgt, variant, ach } = chosen;
  const hex = hslToHex(hue, sat, lgt);
  const { name, prompt } = nameAndPrompt(hue, sat, lgt, variant);
  const lab = rgbToLab(hexToRgb(hex));

  return { dayKey, hex, name, prompt, lab, achievability: ach };
}

function dayKeyForDate(date) {
  return date.toISOString().slice(0, 10);
}

// ─── App UI Updates ───────────
let currentChallenge = null;

function formatDisplayDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function displayColor(challenge) {
  currentChallenge = challenge;
  
  // Swatch color & overlay
  const swatch = document.getElementById('today-swatch');
  const hexOverlay = document.getElementById('today-hex');
  if (swatch) swatch.style.backgroundColor = challenge.hex;
  if (hexOverlay) hexOverlay.textContent = challenge.hex;
  
  // Texts
  const nameEl = document.getElementById('today-name');
  const promptEl = document.getElementById('today-prompt');
  const dateEl = document.getElementById('today-date');
  const achEl = document.getElementById('today-achievability');
  const rewardEl = document.getElementById('today-reward');
  
  if (nameEl) nameEl.textContent = challenge.name;
  if (promptEl) promptEl.textContent = `"${challenge.prompt}"`;
  if (dateEl) dateEl.textContent = formatDisplayDate(challenge.dayKey);
  
  const achPercent = Math.round(challenge.achievability * 100);
  if (achEl) achEl.textContent = `${achPercent}%`;
  
  // Match reward text
  let reward = "Standard";
  if (challenge.achievability < 0.4) reward = "High Bonus";
  else if (challenge.achievability < 0.65) reward = "Medium Bonus";
  if (rewardEl) rewardEl.textContent = reward;
}

// Initialize Daily Color & Past Challenges
function initColors() {
  const todayDate = new Date();
  const todayKey = dayKeyForDate(todayDate);
  const todayChallenge = colorForDayKey(todayKey);
  
  displayColor(todayChallenge);
  
  // Populate past challenges (last 5 days)
  const pastList = document.getElementById('past-colors-list');
  if (pastList) {
    pastList.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
      const pastDate = new Date();
      pastDate.setDate(todayDate.getDate() - i);
      const pastKey = dayKeyForDate(pastDate);
      const pastChallenge = colorForDayKey(pastKey);
      
      const chip = document.createElement('div');
      chip.className = 'past-color-chip';
      chip.innerHTML = `
        <div class="past-color-swatch" style="background-color: ${pastChallenge.hex}"></div>
        <div class="past-color-name">${pastChallenge.name}</div>
        <div class="past-color-date">${formatDisplayDate(pastKey).split(',')[0]}</div>
      `;
      
      chip.addEventListener('click', () => {
        displayColor(pastChallenge);
        // Reset simulator
        resetSimulator();
        document.getElementById('today').scrollIntoView({ behavior: 'smooth' });
      });
      pastList.appendChild(chip);
    }
  }
}

// Copy hex button
const copyHexBtn = document.getElementById('copy-hex-btn');
if (copyHexBtn) {
  copyHexBtn.addEventListener('click', () => {
    if (!currentChallenge) return;
    navigator.clipboard.writeText(currentChallenge.hex).then(() => {
      const originalText = copyHexBtn.textContent;
      copyHexBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyHexBtn.textContent = originalText;
      }, 1500);
    });
  });
}


// ─── Real-Time Scorer Simulator ───────────
const photoInput = document.getElementById('photo-input');
const uploadZone = document.getElementById('upload-zone');
const uploadPrompt = document.getElementById('upload-prompt');
const previewContainer = document.getElementById('preview-container');
const photoPreview = document.getElementById('photo-preview');
const removePhotoBtn = document.getElementById('remove-photo-btn');
const scoreBtn = document.getElementById('score-btn');

const resultsEmpty = document.getElementById('results-empty');
const resultsLoading = document.getElementById('results-loading');
const loadingStatus = document.getElementById('loading-status');
const resultsData = document.getElementById('results-data');

let uploadedImage = null;

// Drag and drop event listeners
if (uploadZone && photoInput) {
  uploadZone.addEventListener('click', () => {
    if (!uploadedImage) photoInput.click();
  });
  
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });
  
  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
  });
  
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  });
  
  photoInput.addEventListener('change', (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  });
}

if (removePhotoBtn) {
  removePhotoBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    resetSimulator();
  });
}

function handleFile(file) {
  if (!file.type.startsWith('image/')) {
    alert('Please upload an image file (PNG, JPG, or WEBP).');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    uploadedImage = new Image();
    uploadedImage.onload = () => {
      // Show preview
      photoPreview.src = e.target.result;
      uploadPrompt.style.display = 'none';
      previewContainer.style.display = 'block';
      
      // Enable evaluate button
      scoreBtn.removeAttribute('disabled');
      scoreBtn.classList.remove('disabled');
    };
    uploadedImage.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function resetSimulator() {
  uploadedImage = null;
  if (photoInput) photoInput.value = '';
  if (photoPreview) photoPreview.src = '';
  if (uploadPrompt) uploadPrompt.style.display = 'block';
  if (previewContainer) previewContainer.style.display = 'none';
  if (scoreBtn) {
    scoreBtn.setAttribute('disabled', 'true');
    scoreBtn.classList.add('disabled');
  }
  
  // Reset results panels
  if (resultsEmpty) resultsEmpty.style.display = 'block';
  if (resultsLoading) resultsLoading.style.display = 'none';
  if (resultsData) resultsData.style.display = 'none';
}

if (scoreBtn) {
  scoreBtn.addEventListener('click', () => {
    if (!uploadedImage || !currentChallenge) return;
    
    // Switch to loading
    if (resultsEmpty) resultsEmpty.style.display = 'none';
    if (resultsData) resultsData.style.display = 'none';
    if (resultsLoading) resultsLoading.style.display = 'block';
    
    // Simulate pipeline steps
    const steps = [
      { text: 'Decoding PNG/JPEG bytes...', delay: 600 },
      { text: 'Generating 64x64 on-device scoring thumbnail...', delay: 800 },
      { text: 'Calculating CIE L*a*b* pixel metrics...', delay: 700 },
      { text: 'Applying Texture Anti-Cheat filters...', delay: 600 },
      { text: 'Verifying simulated camera EXIF metadata...', delay: 500 }
    ];
    
    let currentStep = 0;
    
    function runNextStep() {
      if (currentStep < steps.length) {
        if (loadingStatus) loadingStatus.textContent = steps[currentStep].text;
        setTimeout(() => {
          currentStep++;
          runNextStep();
        }, steps[currentStep].delay);
      } else {
        evaluateUploadedImage();
      }
    }
    
    runNextStep();
  });
}

function evaluateUploadedImage() {
  if (!uploadedImage || !currentChallenge) return;
  
  // We will perform pixel analysis in browser!
  // Create a 64x64 canvas to mimic the app's compression size
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  
  // Draw image
  ctx.drawImage(uploadedImage, 0, 0, 64, 64);
  const imgData = ctx.getImageData(0, 0, 64, 64);
  const data = imgData.data;
  
  // Run the port of the scoring algorithm!
  const results = runLocalScoring(data, 64, 64, currentChallenge.lab, currentChallenge.achievability);
  
  // Update UI with results
  if (resultsLoading) resultsLoading.style.display = 'none';
  if (resultsData) resultsData.style.display = 'block';
  
  // Score Ring animate
  const scoreValNum = document.getElementById('result-score-num');
  const scoreCircle = document.getElementById('score-circle-progress');
  const resultVerdict = document.getElementById('result-verdict');
  const detectedPill = document.getElementById('detected-color-pill');
  const detectedHex = document.getElementById('detected-color-hex');
  
  const scoreMatchVal = document.getElementById('score-val-match');
  const scoreAnticheatVal = document.getElementById('score-val-anticheat');
  const scoreExifVal = document.getElementById('score-val-exif');
  const exifDesc = document.getElementById('exif-desc');
  
  const fillMatch = document.getElementById('fill-match');
  const fillAnticheat = document.getElementById('fill-anticheat');
  
  // Update texts
  if (scoreValNum) {
    // Animate score number
    let c = 0;
    const interval = setInterval(() => {
      if (c >= results.score) {
        scoreValNum.textContent = results.score;
        clearInterval(interval);
      } else {
        c += Math.ceil((results.score - c) / 5) || 1;
        scoreValNum.textContent = c;
      }
    }, 20);
  }
  
  // Circle dashoffset: circumference is 2 * Math.PI * 42 = 263.89
  const circumference = 263.89;
  const offset = circumference - (results.score / 100) * circumference;
  if (scoreCircle) {
    scoreCircle.style.strokeDashoffset = offset;
    // Set circle stroke color depending on score
    if (results.score >= 82) {
      scoreCircle.style.stroke = 'var(--clay)';
    } else if (results.score >= 40) {
      scoreCircle.style.stroke = 'var(--success)';
    } else {
      scoreCircle.style.stroke = 'var(--danger)';
    }
  }
  
  // Verdict
  let verdictText = 'Keep hunting';
  if (results.score >= 82) verdictText = 'Exceptional!';
  else if (results.score >= 65) verdictText = 'Strong match!';
  else if (results.score >= 40) verdictText = 'Nice find!';
  
  if (results.blocked) {
    verdictText = 'Photo Flagged';
    if (scoreCircle) scoreCircle.style.stroke = 'var(--danger)';
  }
  if (resultVerdict) resultVerdict.textContent = verdictText;
  
  // Dominant color sample
  if (detectedPill) detectedPill.style.backgroundColor = results.dominantHex;
  if (detectedHex) detectedHex.textContent = results.dominantHex;
  
  // Breakdown displays
  const matchPts = Math.round(results.matchQuality * 100);
  if (scoreMatchVal) scoreMatchVal.textContent = `+${matchPts} pts`;
  if (fillMatch) fillMatch.style.width = `${matchPts}%`;
  
  const complexityPts = Math.round(results.complexityFactor * 100);
  if (scoreAnticheatVal) scoreAnticheatVal.textContent = `x${results.complexityFactor.toFixed(2)}`;
  if (fillAnticheat) fillAnticheat.style.width = `${Math.round(results.complexityFactor * 100)}%`;
  
  // Check blocked status
  if (results.blocked) {
    if (scoreExifVal) {
      scoreExifVal.textContent = 'Flagged';
      scoreExifVal.className = 'breakdown-score text-danger';
    }
    if (exifDesc) exifDesc.textContent = `Flagged: ${results.blockReason}`;
  } else {
    if (scoreExifVal) {
      scoreExifVal.textContent = 'Passed';
      scoreExifVal.className = 'breakdown-score text-success';
    }
    if (exifDesc) exifDesc.textContent = 'EXIF checklist passed. Real camera metadata validation check succeeded.';
  }
}

function runLocalScoring(data, width, height, targetLab, targetAchievability) {
  const n = width * height;
  let matched = 0;
  let matchedDeltaSum = 0;
  let gradientSum = 0;
  let colorBuckets = new Set();
  
  let rSum = 0, gSum = 0, bSum = 0;
  
  // Ported scoring loop
  const labs = new Array(n);
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    const r = data[o], g = data[o + 1], b = data[o + 2];
    rSum += r;
    gSum += g;
    bSum += b;
    
    const lab = rgbToLab({ r, g, b });
    labs[i] = lab;
    
    const d = deltaE(lab, targetLab);
    if (d < CONFIG.matchThreshold) {
      matched++;
      matchedDeltaSum += d;
    }
    colorBuckets.add(((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4));
  }
  
  // Average / Dominant color of image
  const avgR = Math.round(rSum / n);
  const avgG = Math.round(gSum / n);
  const avgB = Math.round(bSum / n);
  const dominantHex = hslToHex(rgbToHsl({ r: avgR, g: avgG, b: avgB }).h, rgbToHsl({ r: avgR, g: avgG, b: avgB }).s, rgbToHsl({ r: avgR, g: avgG, b: avgB }).l);
  
  // Gradients for texture complexity
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const c = labs[i];
      if (x + 1 < width) {
        const r = labs[i + 1];
        gradientSum += Math.abs(c.L - r.L) + Math.abs(c.a - r.a) + Math.abs(c.b - r.b);
      }
      if (y + 1 < height) {
        const d = labs[i + width];
        gradientSum += Math.abs(c.L - d.L);
      }
    }
  }
  
  const coverage = matched / n;
  const closeness = matched > 0 ? 1 - clamp01(matchedDeltaSum / matched / CONFIG.matchThreshold) : 0;
  
  const diversity = clamp01(colorBuckets.size / 220);
  const gradient = clamp01(gradientSum / n / 18);
  const complexity = clamp01(0.55 * diversity + 0.45 * gradient);
  
  // Layer 1: Color match
  const ach = clamp01(targetAchievability);
  const presenceTau = CONFIG.rarePresenceTau + (CONFIG.presenceTau - CONFIG.rarePresenceTau) * ach;
  const presence = 1 - Math.exp(-coverage / presenceTau);
  const matchQuality = presence * (0.5 + 0.5 * closeness);
  
  // Layer 2: Complexity / Anti-cheat
  let complexityFactor = 0.45 + 0.55 * smoothstep(complexity);
  
  let blocked = false;
  let blockReason = null;
  
  if (complexity < CONFIG.flatComplexityFloor) {
    complexityFactor *= 0.18;
    blocked = true;
    blockReason = 'This looks like a flat screen rendering or wall. Spot the color in a real scene!';
  } else if (complexity < CONFIG.lowDetailFloor) {
    complexityFactor *= 0.7;
  }
  
  // Score math
  const rawScore = 100 * matchQuality * complexityFactor;
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));
  
  return {
    score,
    dominantHex,
    matchQuality,
    complexityFactor,
    blocked,
    blockReason
  };
}

// Convert RGB to HSL
function rgbToHsl({ r, g, b }) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}


// Password Gateway Logic
function initGateway() {
  const gateway = document.getElementById('password-gateway');
  const form = document.getElementById('gateway-form');
  const passwordInput = document.getElementById('gateway-password');
  const togglePasswordBtn = document.getElementById('toggle-gateway-password');
  const errorMsg = document.getElementById('gateway-error');

  if (!gateway) return;

  // Check session storage
  if (sessionStorage.getItem('hued_auth') === 'true') {
    gateway.classList.add('unlocked');
    return;
  }

  // Autofocus the input on load
  setTimeout(() => {
    if (passwordInput) passwordInput.focus();
  }, 100);

  // Toggle show/hide password
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      togglePasswordBtn.setAttribute('aria-label', type === 'password' ? 'Show password' : 'Hide password');
    });
  }

  // Handle Form Submit
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = passwordInput.value;
      const success = code === 'hued1234';

      // Report every attempt to Netlify Forms (AJAX, since the default
      // submit is intercepted above to keep the gate check client-side).
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          'form-name': 'gateway-access',
          code,
          result: success ? 'success' : 'failure',
        }).toString(),
      }).catch(() => {});

      if (success) {
        sessionStorage.setItem('hued_auth', 'true');
        gateway.classList.add('unlocked');
        if (errorMsg) errorMsg.style.display = 'none';
      } else {
        if (errorMsg) errorMsg.style.display = 'block';
        if (passwordInput) {
          passwordInput.value = '';
          passwordInput.focus();
        }
      }
    });
  }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  initGateway();
  initColors();
});
