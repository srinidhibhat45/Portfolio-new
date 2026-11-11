import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { render, escape: esc, collectionUrl } = require('../js/case-study-renderer.js');
const cases = JSON.parse(await readFile(new URL('../content/case-studies.json', import.meta.url), 'utf8'));
const stories = JSON.parse(await readFile(new URL('../content/case-study-stories.json', import.meta.url), 'utf8'));
const themes = JSON.parse(await readFile(new URL('../content/case-study-themes.json', import.meta.url), 'utf8'));
const visuals = JSON.parse(await readFile(new URL('../content/case-study-visuals.json', import.meta.url), 'utf8'));
const pageMap = JSON.parse(await readFile(new URL('../content/case-study-pdf-pages.json', import.meta.url), 'utf8'));
const pdfVersions = Object.fromEntries(await Promise.all(['ux', 'product'].map(async kind => {
  const file = new URL(`../assets/pdfs/case-studies/${kind}-case-studies.pdf`, import.meta.url);
  return [kind, createHash('sha256').update(await readFile(file)).digest('hex').slice(0, 12)];
})));
for (let i = 0; i < cases.length; i++) {
  const c = cases[i];
  if (!stories[c.slug]) throw new Error('Missing narrative: ' + c.slug);
  c.pdfPage = pageMap[c.slug];
  c.pdfVersion = pdfVersions[c.kind];
  c.narrative = stories[c.slug];
  c.theme = themes[c.slug];
  c.visual = visuals[c.slug];
  // A study rebuilt in the second edition keeps its long-form content in its own file.
  try { c.v2 = JSON.parse(await readFile(new URL(`../content/case-studies-v2/${c.slug}.json`, import.meta.url), 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw new Error('Unreadable second-edition content for ' + c.slug + ': ' + error.message); }
  // A rebuilt study speaks for itself everywhere its old headline, summary and role were used
  // (page title, library, share text, llms.txt, structured data).
  if (c.v2) {
    c.headline = c.v2.title.replace(/\[\[|\]\]/g, '');
    c.summary = c.v2.hook.replace(/\[\[|\]\]/g, '');
    const role = c.v2.facts.find(f => f.label === 'Role');
    if (role) c.role = role.value.replace(/\[\[|\]\]/g, '');
  }
  if (!c.theme) throw new Error('Missing project art direction: ' + c.slug);
  const next = cases[(i + 1) % cases.length];
  c.nextStory = {slug:next.slug,name:next.name,headline:next.headline};
  const readingText = render(c, '../').replace(/<[^>]+>/g, ' ');
  c.readingMinutes = Math.max(3, Math.ceil(readingText.split(/\s+/).filter(Boolean).length / 220));
}
const bySlug = Object.fromEntries(cases.map(c => [c.slug, c]));
const designCount = cases.filter(c => c.kind === 'ux').length;
const productCount = cases.filter(c => c.kind === 'product').length;
const base = new URL('../', import.meta.url);
const grounds = JSON.parse(await readFile(new URL('../content/cover-grounds.json', import.meta.url), 'utf8'));
// Each cover ground gives its case study four colours: the ground itself, the text that sits on it,
// an ink that reads on paper, and a pale wash.
const GROUNDS = {
  turmeric: ['#F2B705', '#1B1A17', '#8F6600', '#F7EBC6'], teal: ['#0E7C7B', '#FFFBF2', '#0E7C7B', '#DCEEEA'],
  green: ['#1E5B3A', '#FFFBF2', '#1E5B3A', '#DEEADF'], sindoor: ['#C8281E', '#FFFBF2', '#C8281E', '#F7DFDA'],
  indigo: ['#23357A', '#FFFBF2', '#23357A', '#E0E4F2'], marigold: ['#EF6C1A', '#1B1A17', '#C9500A', '#FAE3D0'],
  lotus: ['#E5527A', '#1B1A17', '#CC3562', '#F9DFE6'], ivory: ['#C8281E', '#FFFBF2', '#C8281E', '#F4E4DA'],
  kohl: ['#1B1A17', '#F2B705', '#8F6600', '#EFE6D2'], wine: ['#532D3A', '#FFFBF2', '#532D3A', '#EEE0E2']
};
const themeCss = Object.keys(themes).map(slug => {
  const g = GROUNDS[grounds[slug]];
  if (!g) throw new Error('Missing cover ground: ' + slug);
  return `.cs-project-${slug}{--cs-ground:${g[0]};--cs-on-ground:${g[1]};--cs-accent:${g[2]};--cs-wash:${g[3]}}`;
}).join('\n');
await writeFile(new URL('css/case-study-themes.css', base), '/* Generated from content/cover-grounds.json: each case study is accented with its cover colour. */\n' + themeCss + '\n');
await mkdir(new URL('case-studies/', base), { recursive: true });
await writeFile(new URL('js/case-studies-data.js', base), '/* Generated from content/case-studies.json and content/case-study-stories.json. */\nwindow.CASE_STUDIES = ' + JSON.stringify(bySlug) + ';\n');
// ---- Search and sharing: every page says what it is, who made it and where it sits on the site. ----
const SITE = 'https://srinidhibhat.com';
const PERSON = { '@type': 'Person', '@id': `${SITE}/#person`, name: 'Srinidhi Bhat', url: `${SITE}/` };
const SOCIAL = { image: `${SITE}/assets/img/srinidhi-bhat-social.jpg`, alt: 'Srinidhi Bhat, Design Engineer in Goa, India — portrait with a subtle gold mandala on cream.' };
// Structured data sits inside a script tag, so "<" is escaped to stop any text from closing it early.
const jsonLd = graph => `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')}</script>`;
const crumbs = (url, trail) => ({ '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`, itemListElement: trail.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })) });
const shareTags = ({ url, type, image, alt }) => `<meta name="author" content="Srinidhi Bhat"><meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1"><meta name="theme-color" content="#842b22">`
  + `<meta property="og:type" content="${type}"><meta property="og:site_name" content="Srinidhi Bhat"><meta property="og:locale" content="en_IN"><meta property="og:url" content="${url}">`
  + `<meta property="og:image" content="${image}"><meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${esc(alt)}">`
  + `<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${image}"><meta name="twitter:image:alt" content="${esc(alt)}">`;
const caseUrl = c => `${SITE}/case-studies/${c.slug}.html`;
// One case study: a share image cut from its cover (assets/social), a breadcrumb trail, and an Article about the project.
function caseHead(c) {
  const url = caseUrl(c), image = `${SITE}/assets/social/${c.slug}.jpg`;
  const about = { '@type': 'CreativeWork', name: c.name, description: c.summary, creativeWorkStatus: c.status, creator: { '@id': PERSON['@id'] } };
  if (c.liveUrl) about.url = c.liveUrl;
  return shareTags({ url, type: 'article', image, alt: `${c.name} cover artwork` }) + `<meta property="article:author" content="${SITE}/">` + jsonLd([
    crumbs(url, [['Srinidhi Bhat', `${SITE}/`], ['Case studies', `${SITE}/case-studies/`], [c.name, url]]),
    { '@type': 'Article', '@id': `${url}#article`, headline: `${c.name}: ${c.headline}`, description: c.summary, url, mainEntityOfPage: url, image, inLanguage: 'en',
      articleSection: c.kind === 'ux' ? 'Design case study' : 'Product case study', keywords: c.role, timeRequired: `PT${c.readingMinutes}M`,
      author: PERSON, publisher: { '@id': PERSON['@id'] }, isPartOf: { '@id': `${SITE}/#website` }, about }
  ]);
}
// The library page: a collection that names every case study.
function libraryHead(description) {
  const url = `${SITE}/case-studies/`;
  return shareTags({ url, type: 'website', image: SOCIAL.image, alt: SOCIAL.alt }) + jsonLd([
    crumbs(url, [['Srinidhi Bhat', `${SITE}/`], ['Case studies', url]]),
    { '@type': 'CollectionPage', '@id': `${url}#collection`, url, name: 'Case studies by Srinidhi Bhat', description, inLanguage: 'en', isPartOf: { '@id': `${SITE}/#website` }, about: { '@id': PERSON['@id'] }, author: PERSON,
      mainEntity: { '@type': 'ItemList', numberOfItems: cases.length, itemListElement: cases.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, url: caseUrl(c) })) } }
  ]);
}
function document(title, description, body, slug = '', head = '') {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} | Srinidhi Bhat</title><meta name="description" content="${esc(description)}">
<link rel="canonical" href="https://srinidhibhat.com/case-studies/${slug}"><meta property="og:title" content="${esc(title)} | Srinidhi Bhat"><meta property="og:description" content="${esc(description)}">${head}<link rel="icon" href="../favicon.ico"><link rel="stylesheet" href="../css/case-studies.css?v=20261111-kaavi-1"><link rel="stylesheet" href="../css/case-study-themes.css?v=20261111-brand-1"><link rel="stylesheet" href="../css/brand.css?v=20261111-kaavi-1"><link rel="stylesheet" href="../css/case-brand.css?v=20261111-kaavi-1"><link rel="stylesheet" href="../css/case-study-v2.css?v=20261112-cases-1"><link rel="stylesheet" href="../css/access.css?v=20261112-access-3"><script>try{if(/[?&]access=on\\b/.test(location.search)||localStorage.getItem('portfolio-access')==='on')document.documentElement.setAttribute('data-access','on')}catch(e){}</script>
</head><body class="cs-page"><button type="button" class="access-skip" data-access-toggle hidden>Turn on accessibility mode</button><div class="access-bar" id="accessBar" role="region" aria-label="Accessibility mode" hidden><p><strong>Accessibility mode is on.</strong> High contrast, larger text, one column, no motion.</p><button type="button" data-access-toggle>Turn off accessibility mode</button></div><header class="cs-page-header"><a href="../">Srinidhi Bhat<span aria-hidden="true">.</span></a><a href="./">All case studies ↗</a><button type="button" class="access-tab" id="accessTab" data-access-toggle aria-pressed="false" title="Turn on accessibility mode" hidden><span class="access-tab-text">Turn on accessibility mode</span></button></header><main>${body}</main><footer class="cs-page-footer"><span>Product thinking, made tangible.</span><a href="../#contact">Let’s talk ↗</a></footer><p class="access-live" id="accessLive" role="status" aria-live="polite"></p><script src="../js/access.js?v=20261112-access-1"></script></body></html>\n`;
}
for (const c of cases) {
  await writeFile(new URL(`case-studies/${c.slug}.html`, base), document(c.name + ' — ' + c.headline, c.summary, render(c, '../'), c.slug + '.html', caseHead(c)));
}
function card(c) {
  const art = `<div class="cs-card-art"><img src="../assets/covers/${c.slug}-800.webp" alt="${esc(c.name)} cover artwork" loading="lazy" decoding="async" width="800" height="533"></div>`;
  return `<a class="cs-study-card cs-project-${c.slug}" href="${c.slug}.html">${art}<div class="cs-card-copy"><span class="cs-card-category">${c.kind === 'ux' ? 'Design story' : 'Product story'} · ${c.readingMinutes} min read</span><h3>${esc(c.narrative.headline.replace(/\[\[|\]\]/g,''))}</h3><p>${esc(c.summary)}</p><span class="cs-card-action">Follow the story <span aria-hidden="true">↗</span></span></div></a>`;
}
const starters = ['arkitype','onespace','applecider','planit','umatter','deckforge'].map(slug => bySlug[slug]);
const body = `<div class="cs-library"><header class="cs-library-hero"><div><p class="cs-eyebrow">Srinidhi Bhat / The stories behind the screens</p><h1>Every interface<br>has a <em>turning point.</em></h1><p class="cs-library-intro">The projects I have designed, the choices I made, and what I would improve next. Each story includes original work and the limits of what I have tested.</p><nav class="cs-library-nav" aria-label="Browse stories"><a href="#start">Start with six stories ↓</a><a href="#design">Design · ${designCount}</a><a href="#products">Products · ${productCount}</a></nav></div><aside class="cs-library-index"><p class="cs-eyebrow">Selected readings</p><ol>${['arkitype','onespace','earthlog'].map((slug,i)=>`<li><a href="${slug}.html"><span>0${i+1}</span><div><strong>${esc(bySlug[slug].name)}</strong><p>${esc(bySlug[slug].headline)}</p></div><span aria-hidden="true">↗</span></a></li>`).join('')}</ol></aside></header><div class="cs-library-section-head"><div><p class="cs-eyebrow">A few good places to begin</p><h2 id="start">Six stories. Different kinds of thinking.</h2></div><p>Research, systems, creative tools, and the decisions that connect them.</p></div><div class="cs-library-grid">${starters.map(card).join('')}</div><div class="cs-library-section-head"><div><p class="cs-eyebrow">Research & exploration</p><h2 id="design">Design stories</h2></div><p>Research, prototypes and interface concepts from the original projects.</p></div><div class="cs-library-grid">${cases.filter(c=>c.kind==='ux').map(card).join('')}</div><div class="cs-library-section-head"><div><p class="cs-eyebrow">Ideas made tangible</p><h2 id="products">Product stories</h2></div><p>Independent tools and games, with the design choices behind them.</p></div><div class="cs-library-grid">${cases.filter(c=>c.kind==='product').map(card).join('')}</div><div class="cs-library-downloads"><span>Prefer a reading copy?</span><a href="${esc(collectionUrl({kind:'ux',pdfVersion:pdfVersions.ux},'../'))}">Design collection PDF ↓</a><a href="${esc(collectionUrl({kind:'product',pdfVersion:pdfVersions.product},'../'))}">Product collection PDF ↓</a></div></div>`;
const libraryDescription = `${cases.length} case studies by Srinidhi Bhat, connecting UX research, product decisions, and working products.`;
await writeFile(new URL('case-studies/index.html', base), document('Case studies — the thinking behind the work', libraryDescription, body, '', libraryHead(libraryDescription)));
// ---- sitemap.xml: every page a search engine should index, the day it last changed, and the images on it. ----
// The day comes from git (today, if the file has changes not yet committed) and is left out when git cannot say.
const today = new Date().toISOString().slice(0, 10);
function lastChanged(file) {
  try {
    const git = args => execFileSync('git', args, { cwd: base, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return git(['status', '--porcelain', '--', file]) ? today : git(['log', '-1', '--format=%cs', '--', file]);
  } catch { return ''; }
}
const pageImages = html => [...new Set([...html.matchAll(/<img[^>]+src="\.\.\/(assets\/[^"?]+)/g)].map(m => `${SITE}/${m[1]}`))];
const pages = [
  { loc: `${SITE}/`, file: 'index.html', images: [`${SITE}/assets/img/about-portrait.webp`] },
  { loc: `${SITE}/case-studies/`, file: 'case-studies/index.html', images: [] },
  ...cases.map(c => ({ loc: caseUrl(c), file: `case-studies/${c.slug}.html`, images: pageImages(render(c, '../')) }))
];
await writeFile(new URL('sitemap.xml', base), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' + pages.map(page => {
  const day = lastChanged(page.file);
  return `  <url><loc>${page.loc}</loc>${day ? `<lastmod>${day}</lastmod>` : ''}${page.images.map(src => `<image:image><image:loc>${esc(src)}</image:loc></image:image>`).join('')}</url>`;
}).join('\n') + '\n</urlset>\n');
// ---- llms.txt: a plain-markdown summary for AI assistants. The opening is content/llms-intro.md;
// the work list is written here so it always matches the case studies. ----
const workLine = c => `- [${c.name}](${caseUrl(c)}): ${c.headline} ${c.summary} Status: ${c.status}.${c.liveUrl ? ` Live at ${c.liveUrl}` : ''}`;
const workList = `## Design case studies\n\n${cases.filter(c => c.kind === 'ux').map(workLine).join('\n')}\n\n## Built products\n\n${cases.filter(c => c.kind === 'product').map(workLine).join('\n')}`;
const llmsIntro = await readFile(new URL('../content/llms-intro.md', import.meta.url), 'utf8');
await writeFile(new URL('llms.txt', base), llmsIntro.replace('{{count}}', cases.length).replace('{{work}}', () => workList).trimEnd() + '\n');
// ---- The home page draws its two project rails with a script. Until that runs, and for readers and
// crawlers that never run it, each rail holds a plain list of the same projects, written here. ----
const indexList = kind => `<ul class="case-index">${cases.filter(c => c.kind === kind).map(c => `<li><a href="case-studies/${c.slug}.html">${esc(c.name)}</a>: ${esc(c.headline)}</li>`).join('')}</ul>`;
const homeBefore = await readFile(new URL('index.html', base), 'utf8');
let homePage = homeBefore;
for (const kind of ['ux', 'product']) {
  const block = new RegExp(`(<!-- case-index:${kind}:start -->)[\\s\\S]*?(<!-- case-index:${kind}:end -->)`);
  if (!block.test(homePage)) { console.warn(`index.html has no case-index:${kind} markers, so that rail has no plain list.`); continue; }
  homePage = homePage.replace(block, (_, start, end) => start + indexList(kind) + end);
}
if (homePage !== homeBefore) await writeFile(new URL('index.html', base), homePage);
// The home page lists every case study in its structured data by hand; say so if one is missing.
const unlisted = cases.filter(c => !homePage.includes(caseUrl(c))).map(c => c.slug);
if (unlisted.length) console.warn('index.html structured data does not list: ' + unlisted.join(', '));
console.log(`Built ${cases.length} static case studies and their reading library.`);
