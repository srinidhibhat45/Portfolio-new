// Sunday Ride leaderboard: GET /api/ride lists the board, POST /api/ride starts a run or posts a time.
// Storage is Netlify Blobs (site-wide, survives deploys). No IP address is stored: rate limits use a salted hash.
// The owner removes a bad entry by deleting its `times/…` key in the Netlify Blobs browser.
import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';

export const STORE = 'portfolio-ride-board';
export const TOP = 10;
export const MIN_TIME = 138;          // the route cannot be ridden faster than 2:18.8, even flat out with no bends
export const MAX_TIME = 3600;
export const SHRI_TIME = 157.1;       // Shri's best run on Sky (2:37.10, set by the owner), pinned on the board as the time to beat.
                                      // In a race the game's Shri rides at about 2:45 when pushed: his race pace, not his best.
const COUNTDOWN_MS = 2500;            // the 3-2-1 before the clock starts, less a little slack
const RUN_TTL_MS = 6 * 3600 * 1000;
const POST_GAP_MS = 20000;

// Names: letters in any script (with their vowel signs), digits, spaces and . ' - _ ; 1 to 20 characters.
const NAME_RE = /^[\p{L}\p{N}][\p{L}\p{M}\p{N} .'_-]*$/u;
const PLATE_RE = /^[A-Z0-9]{4}$/;
// Never on the board, wherever they appear in a name once spaces, digits-for-letters and punctuation are stripped.
const BANNED_PARTS = ['fuck', 'cunt', 'nigg', 'faggot', 'whore', 'slut', 'rapist', 'pussy', 'penis', 'vagina', 'porn', 'bitch', 'bastard', 'wank', 'asshole', 'arsehole', 'retard', 'hitler', 'chutiya', 'chutia', 'chootiya', 'madarchod', 'behenchod', 'bhenchod', 'benchod', 'bhosdi', 'bhosad', 'gaand', 'gandu', 'harami', 'tharki', 'tullu', 'thullu', 'bevarsi', 'pukulu'];
// Banned only as a whole word, because they hide inside real names (Cassidy, Kshitij, Dickens, Nazir, Fukuda, Hancock...).
const BANNED_WORDS = ['ass', 'arse', 'fag', 'fuk', 'cum', 'jizz', 'twat', 'prick', 'dick', 'cock', 'boob', 'boobs', 'tit', 'tits', 'shit', 'rape', 'nazi', 'kkk', 'sex', 'xxx', 'anal', 'gand', 'lodu', 'loda', 'lauda', 'lavda', 'lund', 'randi', 'chod', 'saala', 'kutta', 'boli', 'sule', 'bc', 'mc', 'bsdk', 'kys'];
const RESERVED = ['shri', 'srinidhi', 'srinidhibhat', 'sky'];
const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', 8: 'b', 9: 'g', '@': 'a', '$': 's', '!': 'i' };

const squash = v => v.toLowerCase().replace(/[0-9@$!]/g, c => LEET[c] || c).normalize('NFKD').replace(/[^\p{L}]/gu, '');
const words = v => v.toLowerCase().replace(/[0-9@$!]/g, c => LEET[c] || c).split(/[^\p{L}]+/u).filter(Boolean);
export function isRude(value) {
  const flat = squash(value), list = words(value);
  return BANNED_PARTS.some(p => flat.includes(p)) || list.some(w => BANNED_WORDS.includes(w)) || BANNED_WORDS.includes(flat);
}

export function validateEntry(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw Error('Please send a valid time.');
  let { name, plate, time, run } = data;
  if (typeof name !== 'string') throw Error('Type your name for the board.');
  name = name.normalize('NFC').replace(/\s+/g, ' ').trim();
  if (!name) throw Error('Type your name for the board.');
  if ([...name].length > 20) throw Error('Keep your name to 20 characters.');
  if (!NAME_RE.test(name)) throw Error('Use letters, numbers and spaces in your name.');
  if (typeof plate !== 'string' || !PLATE_RE.test(plate)) throw Error('Your plate needs exactly 4 letters or numbers.');
  if (RESERVED.includes(squash(name))) throw Error("That's who you're racing. Pick your own name.");
  if (plate === 'SHRI') throw Error("That's Shri's plate. Change yours on the title screen and ride again.");
  if (isRude(name)) throw Error("That name can't go on the board. Try another.");
  if (isRude(plate)) throw Error("That plate can't go on the board. Change it on the title screen and ride again.");
  if (typeof time !== 'number' || !Number.isFinite(time) || time < MIN_TIME || time > MAX_TIME) throw Error("That time doesn't look like a ride to the viewpoint.");
  if (typeof run !== 'string' || run.length > 200) throw Error('This run was not started on the board. Ride again to post a time.');
  return { name, plate, time: Math.round(time * 100) / 100, run };
}

const reply = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
const pad = t => String(Math.round(t * 100)).padStart(7, '0');
const idOf = key => key.slice(key.indexOf('-') + 1);

// The signing key lives in the same store and is made on first use, so there is no secret to configure.
async function secret(store) {
  const have = await store.get('meta/secret', { type: 'json' });
  if (have?.key) return Buffer.from(have.key, 'base64');
  await store.setJSON('meta/secret', { key: randomBytes(32).toString('base64') }, { onlyIfNew: true });
  return Buffer.from((await store.get('meta/secret', { type: 'json' })).key, 'base64');
}
const sign = (key, body) => createHmac('sha256', key).update(body).digest('base64url');
export function makeRun(key, now) {
  const body = `${now}.${randomUUID()}`;
  return `${body}.${sign(key, body)}`;
}
export function readRun(key, token) {
  const at = token.lastIndexOf('.');
  if (at < 0) return null;
  const body = token.slice(0, at), mac = Buffer.from(token.slice(at + 1)), want = Buffer.from(sign(key, body));
  if (mac.length !== want.length || !timingSafeEqual(mac, want)) return null;
  const start = Number(body.split('.')[0]);
  return Number.isFinite(start) ? { start, id: body.split('.')[1] } : null;
}

async function board(store, youId) {
  const { blobs } = await store.list({ prefix: 'times/' });
  const keys = blobs.map(b => b.key).sort();
  const top = (await Promise.all(keys.slice(0, TOP).map(k => store.get(k, { type: 'json' })))).filter(Boolean);
  let you = null;
  if (youId) {
    const i = keys.findIndex(k => idOf(k) === youId);
    if (i >= 0) { const entry = i < TOP ? top[i] : await store.get(keys[i], { type: 'json' }); if (entry) you = { rank: i + 1, entry }; }
  }
  return { shri: { name: 'Shri on Sky', plate: 'SHRI', time: SHRI_TIME }, top, total: keys.length, you };
}

export async function handleRide(request, context, deps = {}) {
  const now = deps.now ? deps.now() : Date.now();
  if (!['GET', 'POST'].includes(request.method)) return reply({ error: 'Method not allowed.' }, 405);
  try {
    const store = (deps.store || (await import('@netlify/blobs')).getStore)({ name: STORE, consistency: 'strong' });
    const url = new URL(request.url);
    if (request.method === 'GET') {
      const id = url.searchParams.get('id');
      return reply(await board(store, id && /^[0-9a-f-]{36}$/.test(id) ? id : null));
    }
    if (request.headers.get('origin') !== url.origin) return reply({ error: 'Post your time from the game.' }, 403);
    if (!request.headers.get('content-type')?.startsWith('application/json')) return reply({ error: 'Please send a valid time.' }, 415);
    const text = await request.text();
    if (text.length > 2000) return reply({ error: 'Please send a valid time.' }, 413);
    let data; try { data = JSON.parse(text); } catch { return reply({ error: 'Please send a valid time.' }, 400); }
    const key = await secret(store);

    if (data?.action === 'start') return reply({ run: makeRun(key, now) }, 201);

    let entry; try { entry = validateEntry(data); } catch (e) { return reply({ error: e.message }, 400); }
    const run = readRun(key, entry.run);
    if (!run || now - run.start > RUN_TTL_MS) return reply({ error: 'This run was not started on the board. Ride again to post a time.' }, 400);
    // The ride cannot have taken less real time than the clock shows (pauses only add to it).
    if (now - run.start < entry.time * 1000 + COUNTDOWN_MS) return reply({ error: "That time doesn't match the ride. Ride again to post a time." }, 400);

    // One post per IP every 20 seconds. The IP is hashed with the store's own key and never kept.
    const rate = 'rate/' + createHash('sha256').update(key).update(String(context?.ip || 'unknown')).digest('hex');
    const previous = await store.getWithMetadata(rate, { type: 'json' });
    if (previous && now - previous.data.last < POST_GAP_MS) return reply({ error: 'Give the board a moment. Try again in twenty seconds.' }, 429);
    const reserved = await store.setJSON(rate, { last: now }, previous ? { onlyIfMatch: previous.etag } : { onlyIfNew: true });
    if (!reserved.modified) return reply({ error: 'Give the board a moment. Try again in twenty seconds.' }, 429);

    // A run posts once.
    const used = await store.setJSON('used/' + run.id, { at: now }, { onlyIfNew: true });
    if (!used.modified) return reply({ error: 'This run is already on the board.' }, 409);

    // One row per rider (same name and plate): a slower time leaves the best one where it is.
    const rider = 'riders/' + createHash('sha256').update(entry.name.toLowerCase() + '|' + entry.plate).digest('hex');
    const best = await store.get(rider, { type: 'json' });
    if (best && best.time <= entry.time) {
      const result = await board(store, best.id);
      return reply({ ...result, kept: true, posted: null }, 200);
    }
    const row = { id: randomUUID(), name: entry.name, plate: entry.plate, time: entry.time, at: new Date(now).toISOString() };
    await store.setJSON(`times/${pad(row.time)}-${row.id}`, row, { onlyIfNew: true });
    await store.setJSON(rider, { id: row.id, time: row.time, key: `times/${pad(row.time)}-${row.id}` });
    if (best?.key) await store.delete(best.key);
    return reply({ ...(await board(store, row.id)), kept: false, posted: row }, 201);
  } catch (_) {
    return reply({ error: 'The board is resting. Your time is safe here; try posting again shortly.' }, 503);
  }
}

export default (request, context) => handleRide(request, context);
export const config = { path: '/api/ride' };
