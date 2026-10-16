import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
const require = createRequire(import.meta.url);
const { render, rich } = require('../js/case-study-renderer.js');
const studies = JSON.parse(readFileSync('content/case-studies.json', 'utf8'));
const narratives = JSON.parse(readFileSync('content/case-study-stories.json', 'utf8'));
const visuals = JSON.parse(readFileSync('content/case-study-visuals.json', 'utf8'));
const themes = JSON.parse(readFileSync('content/case-study-themes.json', 'utf8'));
for (const study of studies) { study.narrative = narratives[study.slug]; study.theme = themes[study.slug]; study.visual = visuals[study.slug]; }
const pageMap = JSON.parse(readFileSync('content/case-study-pdf-pages.json', 'utf8'));
const context = vm.createContext({ window: {} });
vm.runInContext(readFileSync('js/site-data.js', 'utf8'), context);

test('every portfolio project has one readable story and its correct supporting destination', () => {
  const { work, vibe } = context.window.SITE_DATA;
  assert.equal(studies.length, work.length + vibe.length);
  assert.equal(new Set(studies.map(c => c.slug)).size, studies.length);
  for (const project of [...work, ...vibe]) {
    const slug = project.slug || project.caseSlug;
    const story = studies.find(c => c.slug === slug);
    assert.ok(story, project.title || project.name);
    if (project.pdf) assert.equal(story.originalPdf, project.pdf);
    else assert.equal(story.liveUrl, project.href);
    assert.ok(existsSync(`case-studies/${slug}.html`));
    assert.ok(pageMap[slug] > 0);
    for (const image of [story.cover, ...story.figures.map(f => f.src)]) assert.ok(existsSync(image), image);
  }
});

test('standalone stories work without JavaScript and have valid internal reading links', () => {
  for (const study of studies) {
    const html = readFileSync(`case-studies/${study.slug}.html`, 'utf8');
    assert.ok(!html.includes('<script'), study.slug);
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    assert.ok(html.includes(study.originalPdf || study.liveUrl));
    assert.ok(html.includes('#page=' + pageMap[study.slug]));
    for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(html.includes(`id="${id}"`), study.slug + ': ' + id);
  }
});

test('authored copy is rendered as text rather than executable HTML in both reading surfaces', () => {
  const c = structuredClone(studies[0]);
  const payload = '<img src=x onerror="alert(1)">';
  c.narrative.headline = `A story [[${payload}]]`;
  c.visual.caption = payload;
  c.problem = payload; c.decisions[0].reason = payload;
  const html = render(c, '../');
  assert.ok(html.includes('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'));
  assert.ok(!html.includes(payload));
  assert.ok(html.includes('href="../assets/pdfs/case-studies/ux-case-studies.pdf#page=1"'));
  assert.ok(!html.includes('Open shareable page'));
  assert.ok(html.includes('<mark>&lt;img'));
  assert.equal(rich('Before [[one]] and [[two]] after'), 'Before <mark>one</mark> and <mark>two</mark> after');
});

test('every story has a complete, distinct visual narrative and authentic supporting artifacts', () => {
  assert.equal(Object.keys(narratives).length, studies.length);
  assert.equal(new Set(studies.map(c => c.narrative.headline)).size, studies.length);
  assert.equal(new Set(studies.map(c => c.narrative.scene)).size, studies.length);
  for (const c of studies) {
    const n = c.narrative;
    for (const field of ['headline', 'scene', 'question', 'insight', 'pivot', 'takeaway', 'evidenceTag']) assert.ok(n[field]?.length > 10, `${c.slug}: ${field}`);
    assert.equal(n.decisionLeads.length, c.decisions.length, c.slug);
    assert.ok(n.journey.length >= 3 && n.annotations.length >= 2, c.slug);
    const html = readFileSync(`case-studies/${c.slug}.html`, 'utf8');
    assert.equal((html.match(/class="cs-scene /g) || []).length, 5, c.slug);
    assert.ok(html.includes('illustrative scenario') && html.includes('proposed work'), c.slug);
    assert.ok(!html.includes('<svg') && !html.includes('Explanatory graphic'), c.slug);
    if (c.visual.src) {
      assert.ok(existsSync(c.visual.src), c.slug);
      assert.ok(html.includes('src="../' + c.visual.src + '"'), c.slug);
      assert.ok(c.visual.alt.length > 15 && c.visual.source, c.slug);
    }
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(new Set(ids).size, ids.length, `${c.slug}: duplicate identifiers`);
    for (const [, references] of html.matchAll(/aria-labelledby="([^"]+)"/g)) for (const id of references.split(' ')) assert.ok(ids.includes(id), `${c.slug}: ${id}`);
  }
});

test('project-specific structure preserves chapter order, audience provenance and design-only contribution', () => {
  assert.equal(new Set(Object.values(themes).map(t => t.layout)).size, studies.length);
  for (const c of studies) {
    const html = readFileSync(`case-studies/${c.slug}.html`, 'utf8');
    assert.ok(html.includes(`cs-project-${c.slug} cs-layout-${c.theme.layout}`), c.slug);
    const positions = c.theme.order.map(key => html.indexOf(`id="${c.slug}-${key}"`));
    assert.ok(positions.every((p,i) => p >= 0 && (!i || p > positions[i-1])), c.slug);
    assert.ok(c.narrative.audience.need && c.narrative.audience.implication, c.slug);
    assert.ok(html.includes(c.narrative.audience.basis), c.slug);
    if (c.kind === 'product') {
      assert.ok(!/implementation|engineering|coding/i.test(c.role), c.slug);
      assert.ok(!/I (built|coded|implemented)|I (?:chose|selected) (?:React|Flutter|Next|a framework)/i.test(JSON.stringify([c.process,c.outcome])), c.slug);
    }
  }
  for (const name of ['Instrument Sans','Architects Daughter','Public Sans','Newsreader','Fredoka']) assert.ok(readFileSync('css/project-fonts.css','utf8').includes('Project ' + name), name);
});


test('the website uses original evidence instead of generic diagram illustrations', () => {
  assert.equal(Object.keys(visuals).length, studies.length);
  const home = readFileSync('index.html', 'utf8');
  const library = readFileSync('case-studies/index.html', 'utf8');
  assert.ok(!home.includes('case-study-graphics.js'));
  assert.ok(!library.includes('cs-library-scrap'));
  assert.ok(library.includes('cs-library-index'));
  for (const c of studies) {
    const html = readFileSync(`case-studies/${c.slug}.html`, 'utf8');
    assert.ok(!html.includes('cs-hero-art') && !html.includes('cg-node'), c.slug);
    if (c.visual.presentation === 'type') {
      assert.ok(!html.includes('cs-evidence-plate'), c.slug);
      assert.ok(!html.includes('assets/products/' + c.slug + '.svg'), c.slug);
    }
  }
  assert.ok(visuals.arkitype.src.includes('workspace'));
  assert.ok(visuals.soundbox.src.includes('practice'));
});

test('every study has a concise reading path with optional depth and one expanded decision', () => {
  for (const c of studies) {
    const html = readFileSync(`case-studies/${c.slug}.html`, 'utf8');
    assert.ok(html.includes('class="cs-reader"'), c.slug);
    assert.ok(!html.includes('cs-reading-guide') && !html.includes('cs-bridge'), c.slug);
    assert.equal((html.match(/<details class="cs-decision"/g) || []).length, 3, c.slug);
    assert.equal((html.match(/<details class="cs-decision"[^>]* open>/g) || []).length, 1, c.slug);
    assert.equal((html.match(new RegExp(`name="${c.slug}-decisions"`, 'g')) || []).length, 3, c.slug);
    assert.ok(html.includes('<summary>User context <span>'), c.slug);
    assert.ok(html.includes('<summary>What I would evaluate next <span>proposed work</span>'), c.slug);
    if (c.visual.src) assert.ok(html.indexOf('class="cs-meta"') < html.indexOf('class="cs-evidence-plate"'), c.slug);
    for (const detail of c.visual.details || []) {
      assert.ok(detail.x >= 0 && detail.y >= 0 && detail.width > 0 && detail.height > 0, c.slug);
      assert.ok(detail.x + detail.width <= c.visual.width && detail.y + detail.height <= c.visual.height, c.slug);
    }
  }
  const invalid = structuredClone(studies.find(c => c.slug === 'earthlog'));
  invalid.visual.details[0].width = invalid.visual.width + 1;
  assert.throws(() => render(invalid), /Invalid source detail/);
});
