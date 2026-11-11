// Sunday Ride: simulation core.
// Route building, riding physics, traffic and rivals. No DOM in here, so it also runs under Node.

export const SEG = 200;            // length of one road segment, in world units
export const MAX_SPEED = 12000;    // world units a second; the speedo shows this as 120 km/h
export const STEP = 1 / 60;
export const RIDERS = 8;
export const PLAYER_W = 0.24;      // widths and sideways offsets are in lanes: the tarmac runs from -1 to 1
export const WALL_H = 1.15;        // height of the rock wall on the hill side, in lanes
export const WALL_AT = 1.3;
export const RAIL_AT = 1.2;

const STEER = 1.9, CENT = 0.3;
const ACCEL = MAX_SPEED / 3.4, BRAKE = MAX_SPEED / 1.5, COAST = MAX_SPEED / 9;
const OFF_DECEL = MAX_SPEED / 1.6, OFF_LIMIT = MAX_SPEED * 0.32;

// w: drawn width in lanes. hit: width that knocks the rider off (0 = ride through).
export const SCENERY = {
  palm: { w: 1.3, hit: 0.12 }, tree: { w: 1.9, hit: 0.22 }, bush: { w: 0.7, hit: 0 }, grass: { w: 0.42, hit: 0 },
  rock: { w: 0.62, hit: 0.5 }, stone: { w: 0.24, hit: 0.16 }, chevL: { w: 0.44, hit: 0.1 }, chevR: { w: 0.44, hit: 0.1 },
  sign: { w: 1.15, hit: 0.2 }, stall: { w: 2.3, hit: 1.9 }, pole: { w: 0.5, hit: 0.07 }, fall: { w: 0.8, hit: 0 },
  arch: { w: 3.3, hit: 0 }, bench: { w: 0.7, hit: 0.5 },
};

export const VEHICLES = {
  lorry: { w: 0.74 }, bus: { w: 0.74 }, car: { w: 0.5 }, auto: { w: 0.42 }, scooter: { w: 0.24 }, cow: { w: 0.62 }, rider: { w: PLAYER_W },
};

const CRUISE = { lorry: [0.27, 0.35], bus: [0.36, 0.45], car: [0.48, 0.6], auto: [0.3, 0.37], scooter: [0.38, 0.5] };
const MIX = [
  ['car', 'car', 'car', 'scooter', 'scooter', 'scooter', 'auto', 'auto', 'bus', 'bus', 'lorry', 'lorry'],
  ['lorry', 'lorry', 'lorry', 'lorry', 'bus', 'bus', 'car', 'car', 'auto', 'scooter'],
  ['car', 'car', 'lorry', 'scooter', 'auto'],
];
const ONCOMING = [['car', 'car', 'bus', 'lorry', 'auto'], ['lorry', 'lorry', 'bus', 'car'], ['car', 'lorry', 'auto']];
// The field: six riders who make up the places. [top speed, cornering], as fractions of what the bike can do.
export const FIELD = [[0.78, 0.76], [0.8, 0.78], [0.82, 0.8], [0.84, 0.82], [0.86, 0.84], [0.875, 0.855]];
// Shri, the one to beat. Quick and tidy, but never riding beyond what the player's own bike can do.
export const SHRI = { top: 0.94, skill: 0.9 };
export const METRE = 360;          // world units in a metre (12000 a second is 120 km/h)

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

// Fraction of top speed at which full steering still holds the lane through a bend of this tightness.
export function safeSpeed(curve) {
  const a = Math.abs(curve) * CENT;
  if (a < 0.01) return 1;
  return Math.min(1, (0.65 + Math.sqrt(0.4225 + 1.4 * a)) / (2 * a));
}

export function buildRoute(seed = 66) {
  const R = rng(seed);
  const ri = (a, b) => a + Math.floor(R() * (b - a + 1));
  const rf = (a, b) => a + R() * (b - a);
  const segs = [];
  const stages = [];
  let y = 0, stage = 0, hill = 0;
  const push = (curve, y2) => {
    segs.push({ i: segs.length, curve, y1: y, y2, stage, pal: stage, hill, kerb: Math.abs(curve) >= 2.4, water: false, view: false, fog: 0, sprites: [], cars: [] });
    y = y2;
  };
  const ease = (a, b, t) => a + (b - a) * (0.5 - Math.cos(t * Math.PI) / 2);
  const road = (enter, hold, leave, curve, climb) => {
    const y0 = y, y1 = y0 + climb * SEG, total = enter + hold + leave;
    let n = 0;
    for (let k = 0; k < enter; k++) push(curve * (k / enter) ** 2, ease(y0, y1, ++n / total));
    for (let k = 0; k < hold; k++) push(curve, ease(y0, y1, ++n / total));
    for (let k = 0; k < leave; k++) push(ease(curve, 0, k / leave), ease(y0, y1, ++n / total));
  };

  // Stage 1: the coast highway. Wide sweepers, palms, a backwater alongside.
  stages.push({ name: 'COAST HIGHWAY', start: 0 });
  road(0, 100, 0, 0, 0);
  for (let k = 24; k < 96; k++) segs[k].water = true;
  while (segs.length < 2750) {
    const r = R();
    if (r < 0.28) {
      const n = ri(70, 150), from = segs.length;
      road(0, n, 0, 0, ri(-6, 6));
      if (n >= 95 && R() < 0.75) for (let k = from + 8; k < from + n - 8; k++) segs[k].water = true;
    } else if (r < 0.78) {
      road(ri(40, 60), ri(60, 130), ri(40, 60), rf(1.4, 3) * (R() < 0.5 ? -1 : 1), ri(-8, 8));
    } else {
      const c = rf(1.8, 2.8) * (R() < 0.5 ? -1 : 1);
      road(30, ri(35, 55), 30, c, ri(-4, 4));
      road(30, ri(35, 55), 30, -c, ri(-4, 4));
    }
  }
  road(0, 70, 0, 0, 4);

  // Stage 2: the ghat. S-bends and hairpins, rock wall on the hill side, a drop on the other.
  stage = 1; hill = -1;
  const ghatStart = segs.length;
  stages.push({ name: 'THE GHAT', start: ghatStart });
  road(0, 50, 0, 0, 8);
  while (segs.length < ghatStart + 3300) {
    let dir = R() < 0.5 ? -1 : 1;
    for (let k = ri(2, 4); k > 0; k--) {
      road(ri(16, 24), ri(22, 46), ri(16, 24), rf(3.4, 4.7) * dir, ri(3, 12));
      dir = -dir;
      if (R() < 0.3) road(0, ri(12, 30), 0, 0, ri(0, 6));
    }
    road(0, ri(30, 60), 0, 0, ri(2, 10));
    // A hairpin turns into the hill, and the hill ends up on the other side of the road.
    const hc = rf(6, 6.7) * hill, hold = ri(50, 72);
    road(24, hold >> 1, 0, hc, ri(4, 8));
    hill = -hill;
    road(0, hold - (hold >> 1), 24, hc, ri(4, 8));
    road(0, ri(24, 50), 0, 0, ri(3, 8));
  }

  // Stage 3: the misty top, and the viewpoint at the end.
  stage = 2; hill = 0;
  const mistStart = segs.length;
  stages.push({ name: 'MISTY TOP', start: mistStart });
  road(0, 60, 0, 0, 5);
  while (segs.length < mistStart + 1650) {
    if (R() < 0.25) road(0, ri(40, 90), 0, 0, ri(-10, 10));
    else road(ri(30, 45), ri(35, 80), ri(30, 45), rf(2, 3.5) * (R() < 0.5 ? -1 : 1), ri(-12, 12));
  }
  road(40, 60, 40, -2.2, 6);
  road(0, 170, 0, 0, 3);
  const finishIndex = segs.length - 12;
  road(0, 330, 0, 0, 0);

  // Mist creeps in near the top of the ghat, sits thick on the plateau and clears for the viewpoint.
  for (const s of segs) {
    const i = s.i;
    if (i >= mistStart - 260 && i < mistStart) s.fog = 0.4 * (i - (mistStart - 260)) / 260;
    else if (i >= mistStart && i < finishIndex - 320) s.fog = Math.min(1, 0.4 + 0.6 * (i - mistStart) / 160) * (0.9 + 0.1 * Math.sin(i / 37));
    else if (i >= finishIndex - 320) s.fog = Math.max(0.1, 0.95 * (finishIndex - i) / 320);
    if (i >= finishIndex + 6) s.view = true;
    // Ground colours swap over a dithered stretch instead of a hard line.
    for (const edge of [ghatStart, mistStart]) {
      const d = i - edge;
      if (d >= -24 && d < 24 && ((i * 7) % 48) < d + 24) s.pal = segs[edge].stage;
      else if (d >= -24 && d < 0) s.pal = segs[edge - 30].stage;
    }
  }

  const route = { segs, stages, ghatStart, mistStart, finishIndex, finishZ: finishIndex * SEG, length: segs.length * SEG };
  decorate(route, R);
  return route;
}

function decorate(route, R) {
  const { segs, ghatStart, mistStart, finishIndex } = route;
  const add = (i, kind, offset, extra) => { const s = segs[i]; if (s) s.sprites.push({ kind, offset, ...extra }); };
  const side = () => (R() < 0.5 ? -1 : 1);

  for (const s of segs) {
    const i = s.i;
    if (i < 10) continue;
    if (s.view) {
      if (i % 9 === 0 && R() < 0.6) add(i, 'tree', -(2.6 + R() * 3));
      continue;
    }
    if (s.stage === 0) {
      if (R() < 0.42) add(i, R() < 0.62 ? 'palm' : 'tree', -(1.75 + R() * R() * 4.5), { flip: R() < 0.5 });
      if (R() < 0.22) add(i, R() < 0.5 ? 'bush' : 'grass', -(1.36 + R() * 1.1));
      if (!s.water) {
        if (R() < 0.42) add(i, R() < 0.62 ? 'palm' : 'tree', 1.75 + R() * R() * 4.5, { flip: R() < 0.5 });
        if (R() < 0.22) add(i, R() < 0.5 ? 'bush' : 'grass', 1.36 + R() * 1.1);
      } else if (R() < 0.2) add(i, R() < 0.6 ? 'grass' : 'bush', 1.36 + R() * 0.12);
      if (i % 44 === 20) add(i, 'pole', 1.42);
      if (i % 320 === 150) add(i, 'stone', -1.2);
    } else if (s.stage === 1) {
      const h = s.hill, v = -h;
      if (R() < 0.3) add(i, 'tree', h * (2.5 + R() * 2.4), { up: WALL_H, flip: R() < 0.5 });
      if (R() < 0.14) add(i, 'bush', h * (1.75 + R() * 0.9), { up: WALL_H });
      if (R() < 0.24) add(i, 'tree', v * (2 + R() * 2.6), { up: -(0.55 + R() * 0.7), flip: R() < 0.5 });
      if (Math.abs(s.curve) > 3.3 && i % 5 === 0) add(i, s.curve > 0 ? 'chevR' : 'chevL', s.curve > 0 ? -1.15 : 1.15);
    } else {
      if (R() < 0.2) add(i, 'tree', side() * (1.9 + R() * 3.6), { flip: R() < 0.5 });
      if (R() < 0.22) add(i, R() < 0.5 ? 'bush' : 'grass', side() * (1.36 + R() * 1.6));
      if (R() < 0.025) add(i, 'rock', side() * (1.5 + R() * 0.7));
    }
  }

  // Waterfalls sit against the rock wall on two straights in the ghat.
  let falls = 0;
  for (let i = ghatStart + 500; i < mistStart - 300 && falls < 2; i++) {
    const s = segs[i];
    if (s.curve === 0 && segs[i + 14].curve === 0 && s.hill && s.hill === segs[i + 14].hill) {
      add(i + 7, 'fall', s.hill * (WALL_AT + 0.42));
      falls++;
      i += 1300;
    }
  }

  // Boards. Signs stand on the left, where India puts them.
  const board = (i, label) => add(i, 'sign', segs[i].hill ? -1.16 : -1.55, { label });
  add(22, 'arch', 0, { label: 'SUNDAY RIDE' });
  board(60, 'g|NH 66/GHAT 28 KM');
  board(430, 'w|SHRI/WAS HERE');
  board(1100, 'y|COWS HAVE/RIGHT OF WAY');
  board(1900, 'w|NO RUSH/NICE ROAD');
  board(ghatStart - 60, 'y|GHAT AHEAD/GO SLOW');
  board(ghatStart + 40, 'y|SHARP/CURVES');
  board(ghatStart + 700, 'y|HORN/OK PLEASE');
  board(ghatStart + 1500, 'w|MIND THE/VIEW');
  board(ghatStart + 2400, 'y|SLOW/HAIRPINS');
  board(mistStart + 30, 'y|MIST AHEAD/LIGHTS ON');
  board(mistStart + 600, 'w|CHAI/200 M');
  add(mistStart + 690, 'stall', -2.5);
  board(finishIndex - 420, 'g|VIEW POINT/1 KM');
  add(finishIndex, 'arch', 0, { label: 'VIEW POINT' });
  add(finishIndex + 60, 'bench', -1.7);
  add(finishIndex + 90, 'stall', -2.6);
  add(finishIndex + 120, 'bench', -1.7);
}

export function createGame(opts = {}) {
  const seed = opts.seed ?? 66;
  const g = { seed, route: buildRoute(seed), events: [] };
  resetGame(g);
  return g;
}

export function resetGame(g) {
  const { route } = g, { segs } = route;
  for (const s of segs) s.cars.length = 0;
  const R = rng(g.seed + 17);
  const ri = (a, b) => a + Math.floor(R() * (b - a + 1));
  g.R = R;
  g.t = 0;
  g.phase = 'count';
  g.count = 3;
  g.place = RIDERS;
  g.finish = null;
  g.clock = 0;                 // keeps running after the player has finished, so Shri's time is still measured
  g.shriAt = null;             // the clock when Shri crossed the line
  g.shriAhead = true;
  g.stage = 0;
  g.spills = 0;
  g.bumps = 0;
  g.events.length = 0;
  g.events.push({ type: 'count', n: 3 });
  g.player = { x: -0.5, z: 8.5 * SEG, speed: 0, lean: 0, spill: 0, safe: 0, horn: 0, hornCd: 0, scrapeCd: 0, gas: false, brake: false, off: false };
  g.cars = [];
  const mk = (kind, seg, offset, frac, dir, extra) => {
    const c = { kind, dir, z: (seg + 0.5) * SEG, offset, base: offset, speed: frac * MAX_SPEED, cruise: frac * MAX_SPEED, w: VEHICLES[kind].w, v: ri(0, 3), aside: 0, rider: false, active: true, at: -1, ...extra };
    g.cars.push(c);
    return c;
  };

  // Traffic heading the same way keeps to the left lane.
  for (let i = 170; i < route.finishIndex - 160;) {
    const st = segs[i].stage, list = MIX[st], kind = list[ri(0, list.length - 1)];
    const [lo, hi] = CRUISE[kind];
    const frac = (lo + R() * (hi - lo)) * (st === 1 ? 0.82 : 1);
    mk(kind, i, (kind === 'scooter' || kind === 'auto' ? -0.64 : -0.5) + (R() - 0.5) * 0.1, frac, 1);
    i += st === 0 ? ri(80, 160) : st === 1 ? ri(85, 160) : ri(110, 190);
  }

  // Cows stand where there is a clear view of them.
  const straight = i => { for (let k = i - 25; k <= i + 10; k++) if (!segs[k] || segs[k].curve !== 0) return false; return true; };
  const herd = (from, to, n) => {
    for (let i = from, left = n; i < to && left > 0; i++) {
      if (straight(i)) { mk('cow', i, [-0.7, -0.28, 0.4][ri(0, 2)], 0, 1, { flip: R() < 0.5 }); left--; i += Math.floor((to - from) / (n + 1)); }
    }
  };
  herd(700, route.ghatStart - 200, 2);
  herd(route.ghatStart + 900, route.mistStart - 400, 1);
  herd(route.mistStart + 250, route.finishIndex - 350, 2);

  // Oncoming traffic is a small pool that is moved back out ahead once it has gone by.
  g.cursor = 0;
  for (const i of [300, 620, 980, 1380]) { const c = mk('car', i, 0.5, 0.4, -1); g.cursor = c.z; dress(g, c); }

  // Six riders staggered ahead of the player on the grid, and Shri at the front of them.
  FIELD.forEach(([top, skill], n) => {
    mk('rider', 12 + n * 3, n % 2 ? -0.3 : -0.7, 0, 1, { rider: true, top, skill, v: n, home: n % 2 ? -0.4 : -0.62, stopZ: route.finishZ + (36 + n * 9) * SEG, park: n % 2 ? 0.55 : -0.55 });
  });
  g.shri = mk('rider', 31, -0.5, 0, 1, { rider: true, shri: true, top: SHRI.top, skill: SHRI.skill, v: 0, home: -0.5, stopZ: route.finishZ + 96 * SEG, park: -0.5 });
  for (const c of g.cars) relist(g, c);
}

function dress(g, c) {
  const st = g.route.segs[Math.min(g.route.segs.length - 1, Math.floor(c.z / SEG))].stage, list = ONCOMING[st];
  c.kind = list[Math.floor(g.R() * list.length)];
  c.w = VEHICLES[c.kind].w;
  c.v = Math.floor(g.R() * 4);
  c.offset = c.base = 0.5 + (g.R() - 0.5) * 0.1;
  c.cruise = c.speed = (st === 1 ? 0.22 + g.R() * 0.14 : 0.3 + g.R() * 0.2) * MAX_SPEED;
}

function relist(g, c) {
  const segs = g.route.segs;
  const at = c.active ? clamp(Math.floor(c.z / SEG), 0, segs.length - 1) : -1;
  if (at === c.at) return;
  if (c.at >= 0) { const list = segs[c.at].cars, k = list.indexOf(c); if (k >= 0) list.splice(k, 1); }
  if (at >= 0) segs[at].cars.push(c);
  c.at = at;
}

function nearestOncoming(g, z, range) {
  let best = null;
  for (const c of g.cars) if (c.dir < 0 && c.active && c.z > z - SEG && c.z < z + range * SEG && (!best || c.z < best.z)) best = c;
  return best;
}

// A cow that has been honked at, or nudged, ambles off to the nearer verge and stays there.
function shoo(g, c) {
  c.base = (c.offset > 0.1 ? 1 : -1) * 1.32;
  c.flip = c.base > 0;
  g.events.push({ type: 'moo' });
}

function spill(g, why) {
  const p = g.player;
  p.spill = 1.5;
  g.spills++;
  g.events.push({ type: 'spill', why });
}

export function step(g, input) {
  const dt = STEP, p = g.player, route = g.route, segs = route.segs, last = segs.length - 1;

  if (g.phase === 'count') {
    const before = Math.ceil(g.count);
    g.count -= dt;
    const after = Math.ceil(g.count);
    if (g.count <= 0) { g.phase = 'ride'; g.events.push({ type: 'go' }); }
    else if (after !== before) g.events.push({ type: 'count', n: after });
    return;
  }
  if (g.phase === 'ride') g.t += dt;
  g.clock += dt;

  const seg = segs[Math.min(last, Math.floor(p.z / SEG))];
  const sp = p.speed / MAX_SPEED;
  let gas = !!input.gas, brake = !!input.brake;
  let steer = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (g.phase === 'done') { gas = false; brake = false; steer = p.x > -0.3 ? -1 : p.x < -0.6 ? 1 : 0; }
  if (p.spill > 0) {
    p.spill -= dt;
    p.speed = Math.max(0, p.speed - BRAKE * 1.3 * dt);
    gas = brake = false; steer = 0;
    if (p.spill <= 0) { p.x = -0.5; p.safe = 2.2; }
  }
  if (p.safe > 0) p.safe -= dt;
  p.gas = gas; p.brake = brake;

  // Steering bites harder with speed; so does the push to the outside of a bend.
  const grip = (0.35 + 0.65 * sp) * Math.min(1, 0.45 + sp * 6);
  p.x += steer * STEER * grip * dt - STEER * sp * sp * seg.curve * CENT * dt;
  const lean = clamp(steer * 0.75 + seg.curve * sp * 0.1, -1, 1) * Math.min(1, sp * 3);
  p.lean += (lean - p.lean) * Math.min(1, dt * 9);

  if (gas) p.speed += ACCEL * (1 - 0.6 * sp) * dt;
  else if (!brake) p.speed -= COAST * dt;
  if (brake) p.speed -= BRAKE * dt;
  if (g.phase === 'done') p.speed -= BRAKE * 0.22 * dt;
  p.off = Math.abs(p.x) > 1.03;
  if (p.off && p.speed > OFF_LIMIT) p.speed -= OFF_DECEL * dt;
  p.speed = clamp(p.speed, 0, MAX_SPEED);

  // Rock wall, crash barrier, or just a long way off the road.
  let limL = 2.6, limR = 2.6;
  if (seg.hill < 0) { limL = WALL_AT - PLAYER_W / 2; limR = RAIL_AT - PLAYER_W / 2; }
  else if (seg.hill > 0) { limR = WALL_AT - PLAYER_W / 2; limL = RAIL_AT - PLAYER_W / 2; }
  else if (seg.view) limL = limR = RAIL_AT - PLAYER_W / 2;
  if (p.x < -limL || p.x > limR) {
    p.x = clamp(p.x, -limL, limR);
    if ((seg.hill || seg.view) && p.speed > OFF_LIMIT * 0.6) {
      p.speed *= 0.985;
      p.scrapeCd -= dt;
      if (p.scrapeCd <= 0) { p.scrapeCd = 0.35; g.events.push({ type: 'scrape' }); }
    }
  }

  p.z = Math.min(p.z + p.speed * dt, route.length - 30 * SEG);
  if (p.z >= route.length - 30 * SEG) p.speed = 0;

  if (g.phase === 'ride' && p.spill <= 0 && p.safe <= 0) {
    // Trees, rocks and posts on the verge.
    if (p.off && p.speed > MAX_SPEED * 0.15) {
      for (const s of seg.sprites) {
        const hit = SCENERY[s.kind].hit;
        if (hit && !s.up && Math.abs(p.x - s.offset) < (hit + PLAYER_W) / 2) { spill(g, 'verge'); break; }
      }
    }
    // Traffic.
    if (p.spill <= 0) {
      scan: for (let k = Math.max(0, seg.i - 1); k <= Math.min(last, seg.i + 2); k++) {
        for (const c of segs[k].cars) {
          if (c.ghost || Math.abs(p.x - c.offset) >= (PLAYER_W + c.w) * 0.46) continue;
          const dz = c.z - p.z;
          if (c.dir < 0) {
            if (dz > -SEG && dz < SEG * 1.6) { spill(g, 'oncoming'); break scan; }
          } else if (dz > 0 && dz < SEG * 1.1 && p.speed > c.speed) {
            if (p.speed - c.speed < MAX_SPEED * 0.12) {
              // Close behind and barely closing: just sit on its tail until there is a way round.
              p.speed = c.speed;
              p.z = Math.min(p.z, c.z - SEG * 0.95);
              continue;
            }
            p.speed = c.speed * 0.8;
            p.z = Math.max(8 * SEG, c.z - SEG * 1.15);
            p.x += (p.x >= c.offset ? 1 : -1) * 0.1;
            g.bumps++;
            g.events.push({ type: 'bump', kind: c.kind });
            if (c.kind === 'cow') { c.ghost = true; if (Math.abs(c.base) < 1.2) shoo(g, c); }   // a nudged cow steps aside and is no longer in the way
          }
        }
      }
    }
  }

  // Horn: slow traffic tucks in to the left, cows amble off to the nearest verge.
  if (p.horn > 0) p.horn -= dt;
  if (p.hornCd > 0) p.hornCd -= dt;
  if (input.horn && p.hornCd <= 0 && g.phase === 'ride' && p.spill <= 0) {
    p.hornCd = 0.5; p.horn = 0.3;
    g.events.push({ type: 'horn' });
    for (let k = seg.i; k <= Math.min(last, seg.i + 45); k++) {
      for (const c of segs[k].cars) {
        if (c.rider || c.dir < 0 || Math.abs(c.offset - p.x) > 0.8) continue;
        if (c.kind === 'cow') { if (Math.abs(c.base) < 1.2) shoo(g, c); }
        else c.aside = 4.5;
      }
    }
  }

  for (const c of g.cars) {
    if (!c.active) continue;
    if (c.rider) rival(g, c, dt);
    else {
      let target = c.base;
      if (c.aside > 0) { c.aside -= dt; target = -1.12 + c.w / 2; }
      const rate = c.kind === 'cow' ? 0.3 : 0.55;
      c.offset += clamp(target - c.offset, -rate * dt, rate * dt);
      let want = c.cruise;
      if (want > 0) {
        // Queue behind anything slower in the same lane.
        const at = Math.max(0, c.at);
        for (let k = at; k <= Math.min(last, at + 3); k++) {
          for (const d of segs[k].cars) {
            if (d === c || d.dir !== c.dir || d.rider) continue;
            const gap = (d.z - c.z) * c.dir;
            if (gap > 0 && gap < SEG * 2.9 && Math.abs(d.offset - c.offset) < (d.w + c.w) / 2) want = Math.min(want, d.speed * 0.97);
          }
        }
      }
      c.speed += clamp(want - c.speed, -BRAKE * 0.5 * dt, ACCEL * 0.5 * dt);
      c.z += c.dir * c.speed * dt;
      if (c.dir < 0) {
        if (c.z < p.z - 8 * SEG || c.z < 2 * SEG) {
          g.cursor = Math.max(g.cursor + (240 + g.R() * 380) * SEG, p.z + 175 * SEG);
          if (g.cursor > route.finishZ - 120 * SEG) c.active = false;
          else { c.z = g.cursor; dress(g, c); }
        }
      } else if (c.z > route.length - 45 * SEG) {
        c.active = false;                   // carried on down the road, out of sight
      }
    }
    relist(g, c);
  }

  // Finishing order, and where Shri is.
  let place = 1;
  for (const c of g.cars) if (c.rider && c.z > p.z) place++;
  const shri = g.shri;
  if (g.shriAt == null && shri.z >= route.finishZ) g.shriAt = g.clock;
  if (g.phase === 'ride') {
    if (place !== g.place) g.events.push({ type: 'place', place, up: place < g.place });
    g.place = place;
    const lead = (shri.z - p.z) / METRE;
    if (g.shriAhead && lead < -3) { g.shriAhead = false; g.events.push({ type: 'shri', ahead: false }); }
    else if (!g.shriAhead && lead > 3) { g.shriAhead = true; g.events.push({ type: 'shri', ahead: true }); }
    const st = seg.stage;
    if (st !== g.stage) { g.stage = st; g.events.push({ type: 'stage', index: st, name: route.stages[st].name }); }
    if (p.z >= route.finishZ) {
      g.phase = 'done';
      // Either Shri is already in, or the margin is how long he still needs at the pace he is holding.
      const beat = g.shriAt == null;
      const margin = beat ? (route.finishZ - shri.z) / Math.max(shri.speed, shri.top * MAX_SPEED * 0.8) : g.clock - g.shriAt;
      g.finish = { time: g.t, place, beat, margin };
      g.events.push({ type: 'finish', time: g.t, place, beat, margin });
    }
  }
}

function rival(g, c, dt) {
  const segs = g.route.segs, last = segs.length - 1, p = g.player;
  const si = Math.min(last, Math.floor(c.z / SEG));
  let want = c.top * MAX_SPEED, skill = c.skill;
  const lead = (c.z - p.z) / SEG;
  if (c.shri) {
    // A gentle rubber band keeps the duel close: he eases off when the player is a long way back and
    // presses on when the player has got away, but never past what the bike itself allows.
    const m = (c.z - p.z) / METRE;
    const band = m > 120 ? 1 - 0.08 * Math.min(1, (m - 120) / 280) : m < -60 ? 1 + 0.045 * Math.min(1, (-60 - m) / 240) : 1;
    want = Math.min(c.top * band, 0.99) * MAX_SPEED;
    skill = Math.min(0.99, c.skill * band);
  } else if (lead > 500) want *= 0.93; else if (lead > 250) want *= 0.97; else if (lead < -200) want *= 1.05;
  let tight = 0;
  for (let k = 2; k <= 12; k += 2) tight = Math.max(tight, Math.abs(segs[Math.min(last, si + k)].curve));
  if (tight > 0.3) want = Math.min(want, safeSpeed(tight) * skill * MAX_SPEED);   // flat out only on the straights
  let target = c.home;
  if (c.z >= c.stopZ) { want = 0; target = c.park; }
  else if (c.z >= g.route.finishZ) want = Math.min(want, MAX_SPEED * 0.45);

  // The nearest slower thing in the way, the player included.
  let block = null;
  const consider = d => {
    if (d.z <= c.z - SEG * 0.6 || d.z > c.z + 16 * SEG || d.speed > c.speed - 100) return;
    if (Math.abs(d.offset - c.offset) < (d.w + c.w) / 2 + 0.08 && (!block || d.z < block.z)) block = d;
  };
  for (let k = Math.max(0, si - 1); k <= Math.min(last, si + 16); k++) for (const d of segs[k].cars) if (d !== c && d.dir > 0) consider(d);
  if (p.safe <= 0) consider({ z: p.z, offset: p.x, w: PLAYER_W, speed: p.speed });
  const on = nearestOncoming(g, c.z, 110);
  if (block) {
    const right = block.offset + (block.w + c.w) / 2 + 0.14, left = block.offset - (block.w + c.w) / 2 - 0.14;
    const rightOk = right < 0.9 && (!on || right + c.w / 2 + 0.1 < on.offset - on.w / 2);
    if (rightOk) target = right;
    else if (left > -0.96) target = left;
    else if (block.z - c.z < 7 * SEG) want = Math.min(want, block.speed);
    if (block.z - c.z < 2.4 * SEG && Math.abs(c.offset - block.offset) < (block.w + c.w) / 2 + 0.02) want = Math.min(want, block.speed * 0.95);
  }
  if (on && on.z - c.z < 70 * SEG) target = Math.min(target, on.offset - (on.w + c.w) / 2 - 0.14);
  c.offset += clamp(target - c.offset, -1.1 * dt, 1.1 * dt);
  c.speed = Math.max(0, c.speed + clamp(want - c.speed, -BRAKE * 0.8 * dt, ACCEL * 0.9 * (1 - 0.5 * c.speed / MAX_SPEED) * dt));
  c.z = Math.min(c.z + c.speed * dt, g.route.length - 34 * SEG);
}

// A rider for the attract mode and for tests. `safety` is how much of the grip it dares to use in a bend:
// about 0.93 is careful, 0.99 is a very good run, 0.8 is a sloppy one.
export function autopilot(g, safety = 0.93) {
  const p = g.player, segs = g.route.segs, last = segs.length - 1;
  const si = Math.min(last, Math.floor(p.z / SEG)), sp = p.speed / MAX_SPEED;
  let tight = 0;
  for (let k = 1; k <= 4 + Math.round(sp * 16); k++) tight = Math.max(tight, Math.abs(segs[Math.min(last, si + k)].curve));
  let vmax = safeSpeed(tight) * safety;
  const home = -0.5;
  let target = home, horn = false;

  // Everything slower that sits in the lane ahead, or that the bike is still alongside.
  let right = -9, lead = null, beside = null;
  for (let k = Math.max(0, si - 2); k <= Math.min(last, si + 26); k++) {
    for (const d of segs[k].cars) {
      const dz = d.z - p.z;
      if (d.dir < 0 || dz < -SEG * 1.4 || (dz > SEG * 2 && d.speed > p.speed - 200)) continue;
      const reach = (d.w + PLAYER_W) / 2 + 0.12;
      if (Math.abs(d.offset - home) >= reach && Math.abs(d.offset - p.x) >= reach) continue;
      right = Math.max(right, d.offset + reach + 0.04);
      if (dz < SEG * 1.6) beside = d;
      else if (!lead || d.z < lead.z) lead = d;
      if (d.kind === 'cow') horn = true;
    }
  }
  const on = nearestOncoming(g, p.z, 150);
  const onGap = on ? (on.z - p.z) / SEG : 1e9;
  if (right > -9) {
    const fits = right < 0.9 && (!on || right + PLAYER_W / 2 + 0.12 < on.offset - on.w / 2);
    if (fits || (beside && onGap > 55 && right < 0.9)) target = right;
    else {
      // No way round yet: ease off early enough to sit behind, and ask for room.
      if (lead) {
        const room = (p.speed * p.speed - lead.speed * lead.speed) / (2 * BRAKE) + 5 * SEG;
        if (lead.z - p.z < room) vmax = Math.min(vmax, lead.speed / MAX_SPEED * 0.96);
        horn = horn || lead.z - p.z < 30 * SEG;
      }
      if (beside) {
        target = Math.max(home, beside.offset + (beside.w + PLAYER_W) / 2 + 0.14);
        vmax = Math.min(vmax, beside.speed / MAX_SPEED * 0.7);
      }
    }
  }
  if (on && onGap < 80) target = Math.min(target, on.offset - (on.w + PLAYER_W) / 2 - 0.14);
  const err = target - p.x;
  if (Math.abs(err) > 0.12 && tight > 3) vmax *= 0.86;
  return { left: err < -0.03, right: err > 0.03, gas: sp < vmax - 0.01, brake: sp > vmax + 0.04, horn };
}

export const kmh = g => Math.round(g.player.speed / 100);
// How far ahead of the player Shri is, in metres (negative when the player leads).
export const shriLead = g => (g.shri.z - g.player.z) / METRE;
export const progress = g => clamp((g.player.z - 8.5 * SEG) / (g.route.finishZ - 8.5 * SEG), 0, 1);
