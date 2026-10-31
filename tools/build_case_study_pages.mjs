import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
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
const font = name => ['DM Sans', 'Libre Caslon Display'].includes(name) ? (name === 'DM Sans' ? "'Case Sans'" : "'Case Display'") : `"Project ${name}"`;
const themeCss = Object.entries(themes).map(([slug,t]) => `.cs-project-${slug}{--cs-paper:${t.paper};--cs-ink:${t.ink};--cs-dim:${t.dim};--cs-line:${t.line};--cs-accent:${t.accent};--cs-wash:${t.wash};--cs-sans:${font(t.bodyFont)},Arial,sans-serif;--cs-display:${font(t.displayFont)},Georgia,serif;--cs-title-weight:${/Fraunces|Newsreader|Cormorant|Caslon|Architects/.test(t.displayFont)?400:600}}`).join('\n');
await writeFile(new URL('css/case-study-themes.css', base), '/* Generated from content/case-study-themes.json. */\n' + themeCss + '\n');
await mkdir(new URL('case-studies/', base), { recursive: true });
await writeFile(new URL('js/case-studies-data.js', base), '/* Generated from content/case-studies.json and content/case-study-stories.json. */\nwindow.CASE_STUDIES = ' + JSON.stringify(bySlug) + ';\n');
function document(title, description, body, slug = '') {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} | Srinidhi Bhat</title><meta name="description" content="${esc(description)}">
<link rel="canonical" href="https://srinidhibhat.com/case-studies/${slug}"><meta property="og:title" content="${esc(title)} | Srinidhi Bhat"><meta property="og:description" content="${esc(description)}"><meta property="og:type" content="article"><link rel="icon" href="../favicon.ico"><link rel="stylesheet" href="../css/project-fonts.css?v=20261031-case-refinement-4"><link rel="stylesheet" href="../css/case-studies.css?v=20261016-impeccable"><link rel="stylesheet" href="../css/case-study-themes.css?v=20261031-case-refinement-4"><link rel="stylesheet" href="../css/case-study-projects.css?v=20261031-case-refinement-4">
</head><body class="cs-page"><header class="cs-page-header"><a href="../index.html">Srinidhi Bhat<span aria-hidden="true">.</span></a><a href="./">All case studies ↗</a></header><main>${body}</main><footer class="cs-page-footer"><span>Product thinking, made tangible.</span><a href="../index.html#contact">Let’s talk ↗</a></footer></body></html>\n`;
}
for (const c of cases) {
  await writeFile(new URL(`case-studies/${c.slug}.html`, base), document(c.name + ' — ' + c.headline, c.summary, render(c, '../'), c.slug + '.html'));
}
function card(c) {
  const art = c.visual.presentation === 'type'
    ? `<div class="cs-card-type"><span>Product direction</span><strong>${esc(c.name)}</strong><p>${esc(c.context)}</p></div>`
    : `<div class="cs-card-art${c.visual.presentation === 'portrait' ? ' cs-card-portrait' : ''}"><img src="../${esc(c.visual.src)}" alt="${esc(c.visual.alt)}" loading="lazy" decoding="async" width="${c.visual.width}" height="${c.visual.height}"><span>${esc(c.name)}</span></div>`;
  return `<a class="cs-study-card cs-project-${c.slug}" href="${c.slug}.html">${art}<div class="cs-card-copy"><span class="cs-card-category">${c.kind === 'ux' ? 'Design story' : 'Product story'} · ${c.readingMinutes} min read</span><h3>${esc(c.narrative.headline.replace(/\[\[|\]\]/g,''))}</h3><p>${esc(c.summary)}</p><span class="cs-card-action">Follow the story <span aria-hidden="true">↗</span></span></div></a>`;
}
const starters = ['arkitype','onespace','applecider','planit','umatter','deckforge'].map(slug => bySlug[slug]);
const body = `<div class="cs-library"><header class="cs-library-hero"><div><p class="cs-eyebrow">Srinidhi Bhat / The stories behind the screens</p><h1>Every interface<br>has a <em>turning point.</em></h1><p class="cs-library-intro">The projects I have designed, the choices I made, and what I would improve next. Each story includes original work and the limits of what I have tested.</p><nav class="cs-library-nav" aria-label="Browse stories"><a href="#start">Start with six stories ↓</a><a href="#design">Design · ${designCount}</a><a href="#products">Products · ${productCount}</a></nav></div><aside class="cs-library-index"><p class="cs-eyebrow">Selected readings</p><ol>${['arkitype','onespace','earthlog'].map((slug,i)=>`<li><a href="${slug}.html"><span>0${i+1}</span><div><strong>${esc(bySlug[slug].name)}</strong><p>${esc(bySlug[slug].headline)}</p></div><span aria-hidden="true">↗</span></a></li>`).join('')}</ol></aside></header><div class="cs-library-section-head"><div><p class="cs-eyebrow">A few good places to begin</p><h2 id="start">Six stories. Different kinds of thinking.</h2></div><p>Research, systems, creative tools, and the decisions that connect them.</p></div><div class="cs-library-grid">${starters.map(card).join('')}</div><div class="cs-library-section-head"><div><p class="cs-eyebrow">Research & exploration</p><h2 id="design">Design stories</h2></div><p>Research, prototypes and interface concepts from the original projects.</p></div><div class="cs-library-grid">${cases.filter(c=>c.kind==='ux').map(card).join('')}</div><div class="cs-library-section-head"><div><p class="cs-eyebrow">Ideas made tangible</p><h2 id="products">Product stories</h2></div><p>Independent tools and games, with the design choices behind them.</p></div><div class="cs-library-grid">${cases.filter(c=>c.kind==='product').map(card).join('')}</div><div class="cs-library-downloads"><span>Prefer a reading copy?</span><a href="${esc(collectionUrl({kind:'ux',pdfVersion:pdfVersions.ux},'../'))}">Design collection PDF ↓</a><a href="${esc(collectionUrl({kind:'product',pdfVersion:pdfVersions.product},'../'))}">Product collection PDF ↓</a></div></div>`;
await writeFile(new URL('case-studies/index.html', base), document('The thinking behind the work', `${cases.length} case studies connecting UX research, product decisions, and working products.`, body));
const urls = ['https://srinidhibhat.com/', 'https://srinidhibhat.com/case-studies/', ...cases.map(c=>`https://srinidhibhat.com/case-studies/${c.slug}.html`)];
await writeFile(new URL('sitemap.xml', base), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.map(url=>`  <url><loc>${url}</loc></url>`).join('\n') + '\n</urlset>\n');
console.log(`Built ${cases.length} static case studies and their reading library.`);
