import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';

const context = vm.createContext({ window: {} });
for (const file of ['js/site-data.js', 'js/project-media.js']) {
  vm.runInContext(readFileSync(file, 'utf8'), context);
}
const original = JSON.stringify(context.window.SITE_DATA);
vm.runInContext(readFileSync('js/brain-data.js', 'utf8'), context);
const { nodes, links, topics } = context.window.BRAIN_MAP;
const { work, vibe } = context.window.SITE_DATA;
const projects = nodes.filter(n => n.kind==='product'||n.kind==='case');
const connections = nodes.filter(n=>n.topic);

test('the brain includes every original project without altering portfolio data', () => {
  assert.equal(JSON.stringify(context.window.SITE_DATA), original);
  assert.equal(projects.length, work.length + vibe.length);
  assert.equal(new Set(nodes.map(n => n.id)).size, nodes.length);
  for (const p of vibe) {
    const n = projects.find(n => n.kind === 'product' && n.name === p.name);
    assert.ok(n, p.name);
    assert.equal(n.desc, p.desc);
    assert.equal(n.href, p.href);
    assert.deepEqual(n.stack, p.stack);
  }
  for (const p of work) {
    const n = projects.find(n => n.caseSlug === p.slug);
    assert.ok(n, p.title);
    assert.equal(n.desc, p.blurb);
    assert.equal(n.tags, p.tags);
  }
});

test('every connection is unique, explained, and leads to a valid node', () => {
  const ids = new Set(nodes.map(n => n.id));
  const seen = new Set();
  for (const link of links) {
    assert.ok(ids.has(link.from) && ids.has(link.to));
    assert.notEqual(link.from, link.to);
    assert.ok(link.reason.length > 20);
    const key = [link.from, link.to].sort().join('|');
    assert.ok(!seen.has(key), key);
    seen.add(key);
  }
  const reached = new Set(['me']);
  for (let i = 0; i < nodes.length; i++) {
    for (const l of links) {
      if (reached.has(l.from)) reached.add(l.to);
      if (reached.has(l.to)) reached.add(l.from);
    }
  }
  assert.equal(reached.size, nodes.length, 'all projects can be reached from the overview');
});

test('themes have accurate counts and projects have usable previews', () => {
  for (const topic of topics) {
    assert.equal(topic.count, connections.filter(n => n.topic === topic.id).length);
    for (const name of topic.examples) assert.ok(connections.some(n => n.name === name));
  }
  for (const n of projects) {
    assert.ok(topics.some(t => t.id === n.topic));
    assert.ok(links.some(l => l.from === n.topic && l.to === n.id));
    assert.ok(n.thumb && existsSync(n.thumb), n.name + ' preview');
  }
});


test('Yuva is a volunteer role with all six organisational pillars, distinct from the built website',()=>{
  const role=nodes.find(n=>n.id==='yuva-volunteer');
  assert.equal(role.kind,'role');
  assert.match(role.desc,/Executive Member and volunteer/);
  const pillars=nodes.filter(n=>n.kind==='pillar');
  assert.deepEqual(Array.from(pillars,n=>n.name),['Women & Child Welfare','Senior Citizen Support','Health Initiatives','Youth Development','Sports & Wellness','Environment & Culture']);
  for(const pillar of pillars){
    assert.ok(links.some(l=>l.from===role.id&&l.to===pillar.id));
    assert.match(pillar.desc,/^Yuva /);
  }
  const website=nodes.find(n=>n.name==='Yuva Panaji');
  assert.equal(website.kind,'product');
  assert.ok(links.some(l=>l.from===role.id&&l.to===website.id));
});
