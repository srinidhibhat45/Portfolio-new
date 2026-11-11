import test from 'node:test';
import assert from 'node:assert/strict';
import { handleRide, validateEntry, isRude, MIN_TIME, SHRI_TIME, TOP } from '../netlify/functions/ride.mjs';
import { createGame, step, autopilot, MAX_SPEED } from '../js/ride/sim.js';

// An in-memory stand-in for a Netlify Blobs store.
function memoryStore() {
  const saved = new Map(); let etag = 0;
  return {
    saved,
    async get(key) { return saved.get(key)?.data ?? null; },
    async getWithMetadata(key) { const v = saved.get(key); return v ? { data: v.data, etag: v.etag } : null; },
    async setJSON(key, data, o = {}) {
      const prev = saved.get(key);
      if (o.onlyIfNew && prev || o.onlyIfMatch && prev?.etag !== o.onlyIfMatch) return { modified: false };
      saved.set(key, { data: structuredClone(data), etag: String(++etag) }); return { modified: true };
    },
    async delete(key) { saved.delete(key); },
    async list({ prefix }) { return { blobs: [...saved.keys()].filter(k => k.startsWith(prefix)).map(key => ({ key })) }; },
  };
}

const site = 'https://portfolio.example', endpoint = site + '/api/ride';
function harness() {
  const store = memoryStore(); let clock = 1_700_000_000_000, ip = 'rider-1';
  const run = req => handleRide(req, { ip }, { store: () => store, now: () => clock });
  const post = (body, origin = site) => run(new Request(endpoint, { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body) }));
  const start = async () => (await (await post({ action: 'start' })).json()).run;
  return { store, run, post, start, wait: s => { clock += s * 1000; }, as: who => { ip = who; } };
}

test('the course floor and the pinned Shri time match the game itself', () => {
  const g = createGame();
  assert.ok((g.route.finishZ - g.player.z) / MAX_SPEED >= MIN_TIME, 'no real ride can beat the floor');
  // Shri's pinned time is his pace when a very good rider pushes him all the way.
  let n = 0; while ((g.shriAt == null || !g.finish) && n++ < 60 * 600) step(g, autopilot(g, 1));
  assert.ok(Math.abs(g.shriAt - SHRI_TIME) < 1.5, `Shri rode ${g.shriAt}`);
  assert.ok(g.finish.time > MIN_TIME);
});

test('names are checked, plates are strict and rude words stay off', () => {
  const ok = { name: '  Asha   K ', plate: 'GA07', time: 170.123, run: 'x' };
  assert.deepEqual(validateEntry(ok), { name: 'Asha K', plate: 'GA07', time: 170.12, run: 'x' });
  assert.equal(validateEntry({ ...ok, name: 'ಅನನ್ಯ' }).name, 'ಅನನ್ಯ');
  for (const name of ['', '   ', 'A'.repeat(21), '<b>hi</b>', 'Shri', 'S K Y', 'f.u.c.k', 'Sh1t', 'chutiya rider'])
    assert.throws(() => validateEntry({ ...ok, name }), undefined, name);
  for (const plate of ['ga07', 'GA0', 'GA077', 'SH1T', 'SHRI']) assert.throws(() => validateEntry({ ...ok, plate }), undefined, plate);
  for (const time of [MIN_TIME - 1, 4000, NaN, '170']) assert.throws(() => validateEntry({ ...ok, time }));
  for (const name of ['Kshitij', 'Cassidy', 'Dickens', 'Nazir', 'Hancock', 'Fukuda', 'Draper', 'Scott'])
    assert.equal(isRude(name), false, name);
});

test('a ride posts once, needs a real ride and keeps one row per rider', async () => {
  const h = harness();
  const empty = await (await h.run(new Request(endpoint))).json();
  assert.deepEqual(empty.top, []); assert.equal(empty.shri.time, SHRI_TIME);

  let run = await h.start();
  h.wait(60);
  assert.equal((await h.post({ name: 'Asha', plate: 'GA07', time: 170, run })).status, 400, 'faster than the wall clock');
  h.wait(120);
  const first = await h.post({ name: 'Asha', plate: 'GA07', time: 170, run });
  assert.equal(first.status, 201);
  const one = await first.json();
  assert.equal(one.you.rank, 1); assert.equal(one.posted.name, 'Asha');
  h.wait(30);
  assert.equal((await h.post({ name: 'Asha', plate: 'GA07', time: 170, run })).status, 409, 'a run posts once');
  assert.equal((await h.post({ name: 'Asha', plate: 'GA07', time: 170, run: run.replace(/.$/, c => (c === 'A' ? 'B' : 'A')) })).status, 400, 'forged token');
  assert.equal((await h.post({ name: 'Asha', plate: 'GA07', time: 170, run }, 'https://elsewhere.example')).status, 403);

  // A slower ride by the same rider leaves the best time alone; a faster one replaces it.
  run = await h.start(); h.wait(200);
  const slower = await (await h.post({ name: 'asha', plate: 'GA07', time: 180, run })).json();
  assert.equal(slower.kept, true); assert.equal(slower.you.entry.time, 170);
  run = await h.start(); h.wait(200);
  assert.equal((await h.post({ name: 'Asha', plate: 'GA07', time: 160, run })).status, 201);
  assert.equal([...h.store.saved.keys()].filter(k => k.startsWith('times/')).length, 1);

  // Twenty-second gap per visitor.
  run = await h.start(); h.wait(170);
  h.as('rider-2');
  assert.equal((await h.post({ name: 'Bo', plate: 'KA01', time: 165, run })).status, 201);
  run = await h.start(); h.wait(170);
  assert.equal((await h.post({ name: 'Cy', plate: 'KA02', time: 166, run })).status, 201, '170 s later is fine');
  run = await h.start();
  h.wait(5);
  assert.equal((await h.post({ name: 'Di', plate: 'KA03', time: 150, run })).status, 400);

  // Nothing about the visitor's address is kept.
  assert.ok(![...h.store.saved.keys()].some(k => k.includes('rider-')));
  assert.ok(!JSON.stringify([...h.store.saved.values()]).includes('rider-'));
});

test('the board lists the top ten in order and still finds a rider further down', async () => {
  const h = harness();
  let last;
  for (let i = 0; i < TOP + 3; i++) {
    h.as('ip-' + i);
    const run = await h.start(); h.wait(400);
    last = await (await h.post({ name: 'Rider ' + i, plate: 'AB' + String(i).padStart(2, '0'), time: 150 + (i * 7) % 13, run })).json();
  }
  const view = await (await h.run(new Request(endpoint + '?id=' + last.posted.id))).json();
  assert.equal(view.top.length, TOP); assert.equal(view.total, TOP + 3);
  assert.deepEqual(view.top.map(r => r.time), [...view.top.map(r => r.time)].sort((a, b) => a - b));
  assert.equal(view.you.entry.id, last.posted.id);
  assert.ok(view.you.rank >= 1 && view.you.rank <= TOP + 3);
  assert.equal((await h.run(new Request(endpoint, { method: 'DELETE' }))).status, 405);
});
