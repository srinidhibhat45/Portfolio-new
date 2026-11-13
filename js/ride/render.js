// Sunday Ride: the renderer. A segment-projected road drawn one scanline at a time so every edge stays on the pixel grid.

import { SEG, MAX_SPEED, WALL_H, WALL_AT, RAIL_AT, SCENERY, VEHICLES, RIDERS, THAR_LINE, kmh, progress, shriLead } from './sim.js?v=20261113-thar-2';
import { drawText, drawTextShadow, textWidth } from './font.js?v=20261113-thar-2';

export const VIEW_W = 320;
const W = VIEW_W;
const ROAD = 1600;                 // half the road's width, in world units
const CAM_H = 1400;
const CAM_D = 1 / Math.tan(50 * Math.PI / 180);
const PLAYER_Z = CAM_H * CAM_D;
const DRAW = 150;
const LANE_PX = ROAD / CAM_H * W / 2;   // one lane's width in pixels at the rider's depth
const TILE = 512;
const CREAM = '#F6F0E4', INK = '#1a1512';

const GROUND = [
  { road: ['#56575f', '#515259'], grass: ['#58a53c', '#4f9a37'], verge: ['#b8562c', '#a94c26'], line: '#ecebe0', kerb: ['#f1efe6', '#26262b'], water: ['#3b82b8', '#4790c4'] },
  { road: ['#4c4e56', '#474950'], grass: ['#2f7d3c', '#2a7337'], verge: ['#9c4a2a', '#8f4326'], line: '#e6e5da', kerb: ['#f1efe6', '#26262b'], water: ['#3b82b8', '#4790c4'] },
  { road: ['#43464c', '#3f4247'], grass: ['#5c8d5e', '#548557'], verge: ['#8a5a44', '#7f523e'], line: '#dcdcd4', kerb: ['#e6e4dc', '#2c2c31'], water: ['#3b82b8', '#4790c4'] },
];
const ROCK = ['#7b5140', '#6d4638', '#5e3c31'], ROCK_TOP = '#3c7a3a', ROCK_FLOOR = '#5a3a2e';
const RAIL = '#cfd3d8', RAIL_LO = '#8e949c';

// Time of day along the route: soft morning, bright day, mist on the plateau, golden hour at the viewpoint.
const KEYS = [
  { p: 0.00, top: '#6aa7d8', mid: '#b5d8ec', low: '#f6e2c4', haze: '#e4e6d6', far: '#9bbccb', hill: '#6da38c', near: '#3f8450', cloud: '#fff7ec', sun: '#fff4cf', sx: 0.20, sy: 0.62, tint: '#fff0dc' },
  { p: 0.28, top: '#3d8ed9', mid: '#84c2ee', low: '#d5edf6', haze: '#d8ebe6', far: '#84b3c4', hill: '#4f9872', near: '#2f7c46', cloud: '#ffffff', sun: '#fffbe2', sx: 0.30, sy: 0.30, tint: '#ffffff' },
  { p: 0.60, top: '#4a94d2', mid: '#9bcbe6', low: '#dcebe8', haze: '#d7e5df', far: '#86aeb6', hill: '#4a8a69', near: '#2b6c44', cloud: '#f8faf8', sun: '#fffbe2', sx: 0.45, sy: 0.16, tint: '#ffffff' },
  { p: 0.80, top: '#9aaeb4', mid: '#bccac9', low: '#d9dfd8', haze: '#d0d9d3', far: '#9aadab', hill: '#7a9889', near: '#5c7f66', cloud: '#e6ebe7', sun: '#f6f2e2', sx: 0.56, sy: 0.30, tint: '#f1f5f5' },
  { p: 0.93, top: '#a3acb6', mid: '#d3c7bc', low: '#f0dfc6', haze: '#e2d8c8', far: '#a09aa6', hill: '#7d8a84', near: '#58705f', cloud: '#f2e3d2', sun: '#fff0cf', sx: 0.64, sy: 0.62, tint: '#fff4e6' },
  { p: 1.00, top: '#52609f', mid: '#ee8f5c', low: '#ffd98f', haze: '#f6c995', far: '#93708f', hill: '#63506f', near: '#3d3552', cloud: '#ffcfa6', sun: '#fff2b8', sx: 0.68, sy: 0.88, tint: '#ffd9ad' },
];

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const rgb = hex => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
const hex = ([r, g, b]) => '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return hex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]); };
const blank = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const ordinal = n => n + (['TH', 'ST', 'ND', 'RD'][n % 10 > 3 || (n % 100 > 10 && n % 100 < 14) ? 0 : n % 10]);

export function formatTime(t) {
  const m = Math.floor(t / 60), s = t - m * 60;
  return `${m}:${s < 10 ? '0' : ''}${s.toFixed(1)}`;
}
export { ordinal };

export function createRenderer(canvas, art) {
  const ctx = canvas.getContext('2d', { alpha: false });
  let H = canvas.height;
  let palStep = -1, pal = null, sky = null, skyLayer = null, layers = [], floor = null;
  let skyOff = 0, bgY = 0, clock = 0;
  const fogCache = new Map();
  const dust = [];
  const says = [];             // timed messages on the screen
  const pops = [];             // what the Thars are saying and honking, drawn over everything on the road
  let toast = null;

  // Ridge lines for the three hill layers; whole numbers of waves so the tile wraps cleanly.
  const ridge = (base, waves) => Array.from({ length: TILE }, (_, x) => {
    let h = base;
    for (const [n, amp, ph, fold] of waves) { const v = Math.sin(x / TILE * Math.PI * 2 * n + ph); h += amp * (fold ? Math.abs(v) : v); }
    return Math.round(h);
  });
  const RIDGES = [
    ridge(26, [[2, 10, 1], [5, 6, 2.2], [11, 3, 0.4], [3, 5, 4, true]]),
    ridge(17, [[3, 7, 0.6], [7, 4, 2.9], [17, 2, 1.3]]),
    ridge(9, [[4, 4, 2], [9, 2, 0.7], [40, 2, 0, true]]),
  ];
  const LAYER_H = [58, 44, 30], LAYER_DROP = [0, 4, 9], LAYER_SPEED = [0.25, 0.45, 0.8];

  function setSize(h) {
    H = h;
    canvas.width = W; canvas.height = H;
    ctx.imageSmoothingEnabled = false;
    palStep = -1;
  }

  function palette(prog) {
    const step = Math.round(prog * 48);
    if (step === palStep) return;
    palStep = step;
    const p = step / 48;
    let a = KEYS[0], b = KEYS[KEYS.length - 1];
    for (let k = 0; k < KEYS.length - 1; k++) if (p >= KEYS[k].p && p <= KEYS[k + 1].p) { a = KEYS[k]; b = KEYS[k + 1]; break; }
    const t = b.p === a.p ? 0 : (p - a.p) / (b.p - a.p);
    pal = {};
    for (const key of ['top', 'mid', 'low', 'haze', 'far', 'hill', 'near', 'cloud', 'sun', 'tint']) pal[key] = mix(a[key], b[key], t);
    pal.sx = a.sx + (b.sx - a.sx) * t; pal.sy = a.sy + (b.sy - a.sy) * t;
    fogCache.clear();
    paintBackdrop();
  }

  function paintBackdrop() {
    const y0 = H >> 1;
    // Banded sky, with a dithered row where two bands meet.
    sky = blank(W, H);
    let g = sky.getContext('2d');
    const bands = 12, edge = y0 + 12;
    let y = 0;
    for (let k = 0; k < bands; k++) {
      const t = k / (bands - 1);
      const col = t < 0.55 ? mix(pal.top, pal.mid, t / 0.55) : mix(pal.mid, pal.low, (t - 0.55) / 0.45);
      const next = Math.round(edge * Math.pow((k + 1) / bands, 0.8));
      g.fillStyle = col; g.fillRect(0, y, W, next - y + 1);
      if (k) for (let x = (k & 1); x < W; x += 2) g.fillRect(x, y - 1, 1, 1);
      y = next;
    }
    g.fillStyle = pal.near; g.fillRect(0, edge, W, H - edge);

    // Sun and clouds drift with the far hills when the road turns.
    skyLayer = blank(TILE, y0 + 8);
    g = skyLayer.getContext('2d');
    const sx = Math.round(pal.sx * TILE), sy = Math.round(pal.sy * (y0 - 6));
    const disc = (cx, cy, r, col, dither) => {
      g.fillStyle = col;
      for (let dy = -r; dy <= r; dy++) {
        const hw = Math.floor(Math.sqrt(r * r + r * 0.6 - dy * dy));
        if (!dither) g.fillRect(cx - hw, cy + dy, hw * 2 + 1, 1);
        else for (let dx = -hw; dx <= hw; dx++) if ((dx + dy) & 1) g.fillRect(cx + dx, cy + dy, 1, 1);
      }
    };
    disc(sx, sy, 13, pal.sun, true);
    disc(sx, sy, 8, pal.sun);
    const spots = [[40, 0.2, 0], [150, 0.34, 1], [230, 0.14, 2], [330, 0.4, 1], [400, 0.22, 0], [470, 0.5, 3], [95, 0.56, 3]];
    for (const [cx, fy, n] of spots) {
      const c = art.clouds[n], cy = Math.round(fy * (y0 - 14));
      g.drawImage(c, cx, cy);
      g.globalCompositeOperation = 'source-atop'; g.fillStyle = pal.cloud; g.fillRect(cx, cy, c.width, c.height);
      g.fillStyle = mix(pal.cloud, pal.mid, 0.35); g.fillRect(cx, cy + c.height - 2, c.width, 2);
      g.globalCompositeOperation = 'source-over';
    }

    // Three ranges of hills, the far one fading into the haze at its foot.
    const cols = [pal.far, pal.hill, pal.near];
    layers = RIDGES.map((heights, n) => {
      const h = LAYER_H[n], c = blank(TILE, h), lg = c.getContext('2d');
      const body = cols[n], rim = mix(body, pal.low, 0.3), shade = mix(body, n === 0 ? pal.haze : '#10221a', n === 0 ? 0.45 : 0.25);
      for (let x = 0; x < TILE; x++) {
        const top = h - heights[x];
        lg.fillStyle = body; lg.fillRect(x, top, 1, h - top);
        lg.fillStyle = rim; lg.fillRect(x, top, 1, 1);
        lg.fillStyle = shade;
        const from = top + Math.round(heights[x] * (n === 0 ? 0.45 : 0.4));
        for (let yy = from; yy < h; yy++) if (((x + yy) & 1) === 0 || yy > from + heights[x] * 0.35) lg.fillRect(x, yy, 1, 1);
      }
      return c;
    });

    // What you see past the crash barrier: the valley floor, striped with haze.
    floor = blank(W, H);
    g = floor.getContext('2d');
    const deep = mix(pal.near, '#0f241a', 0.35);
    for (let yy = 0; yy < H; yy++) {
      const t = Math.min(1, yy / 60);
      g.fillStyle = mix(pal.near, deep, t); g.fillRect(0, yy, W, 1);
      if (yy % 7 === 3) { g.fillStyle = mix(pal.near, pal.haze, 0.35 * (1 - t)); for (let x = (yy & 1) * 2; x < W; x += 4) g.fillRect(x, yy, 2, 1); }
    }
  }

  function fogged(col, f) {
    if (f <= 0) return col;
    const level = Math.min(16, Math.round(f * 16));
    if (!level) return col;
    const key = col + level;
    let out = fogCache.get(key);
    if (!out) { out = mix(col, pal.haze, level / 16); fogCache.set(key, out); }
    return out;
  }

  const fill = (x, y, w, h, col) => { if (w > 0 && h > 0) { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); } };

  function tile(img, off, y) {
    const x = -Math.round(((off % TILE) + TILE) % TILE);
    ctx.drawImage(img, x, y);
    if (x + TILE < W) ctx.drawImage(img, x + TILE, y);
  }

  function blit(img, ww, wpx, sx, sy, clip, alpha, up = 0, flip = false) {
    const dw = Math.round(ww * wpx);
    if (dw < 1 || dw > 2600) return;
    const dh = Math.max(1, Math.round(dw * img.height / img.width));
    const dx = Math.round(sx - dw / 2), dy = Math.round(sy - up * wpx) - dh;
    if (dx >= W || dx + dw <= 0 || dy >= H || dy + dh <= 0) return;
    let vis = dh;
    if (clip != null && dy + dh > clip) vis = Math.floor(clip - dy);
    if (vis <= 0 || alpha <= 0.03) return;
    ctx.globalAlpha = alpha;
    const sh = img.height * vis / dh;
    if (flip) { ctx.save(); ctx.translate(dx + dw, dy); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, img.width, sh, 0, 0, dw, vis); ctx.restore(); }
    else ctx.drawImage(img, 0, 0, img.width, sh, dx, dy, dw, vis);
    ctx.globalAlpha = 1;
  }

  function wall(s, side) {
    const xa = Math.round(s._sx2 + side * WALL_AT * s._w2), xz = Math.round(s._sx1 + side * WALL_AT * s._w1);
    const from = Math.max(0, Math.min(xa, xz)), to = Math.min(W - 1, Math.max(xa, xz));
    if (to < 0 || from >= W) return;
    const body = fogged(ROCK[(s.i >> 1) % 3], s._f), cap = fogged(ROCK_TOP, s._f), foot = fogged(ROCK[2], s._f);
    for (let x = from; x <= to; x++) {
      const t = xz === xa ? 1 : (x - xa) / (xz - xa);
      const ground = s._y2 + (s._y1 - s._y2) * t, h = WALL_H * (s._w2 + (s._w1 - s._w2) * t);
      const top = Math.round(ground - h), bot = Math.round(Math.min(s._clip, ground));
      if (top >= bot) continue;
      const lid = Math.max(1, Math.round(h * 0.1));
      fill(x, top, 1, Math.min(lid, bot - top), cap);
      fill(x, top + lid, 1, bot - top - lid, body);
      if (h > 30) fill(x, bot - Math.max(1, Math.round(h * 0.06)), 1, Math.max(1, Math.round(h * 0.06)), foot);
    }
  }

  function rail(s, side) {
    const xa = Math.round(s._sx2 + side * RAIL_AT * s._w2), xz = Math.round(s._sx1 + side * RAIL_AT * s._w1);
    const from = Math.max(0, Math.min(xa, xz)), to = Math.min(W - 1, Math.max(xa, xz));
    if (to < 0 || from >= W) return;
    const bar = fogged(RAIL, s._f), lo = fogged(RAIL_LO, s._f);
    for (let x = from; x <= to; x++) {
      const t = xz === xa ? 1 : (x - xa) / (xz - xa);
      const ground = s._y2 + (s._y1 - s._y2) * t, wpx = s._w2 + (s._w1 - s._w2) * t;
      const top = Math.round(ground - 0.34 * wpx), thick = Math.max(1, Math.round(0.13 * wpx));
      if (top >= s._clip) continue;
      fill(x, top, 1, Math.min(thick, s._clip - top), bar);
      if (thick > 2) fill(x, top + thick - 1, 1, 1, lo);
    }
    if (s.i % 3 === 0 && xz >= 0 && xz < W) {
      const wpx = s._w1, top = Math.round(s._y1 - 0.34 * wpx), bot = Math.round(Math.min(s._clip, s._y1)), pw = Math.max(1, Math.round(0.035 * wpx));
      if (bot > top) { fill(xz - (pw >> 1), top, pw, bot - top, lo); if (pw > 1) fill(xz - (pw >> 1), top + Math.round(0.05 * wpx), pw, Math.max(1, Math.round(0.05 * wpx)), '#c9302a'); }
    }
  }

  function say(text, seconds = 1.6, scale = 3, y = 0.3) { says.push({ text, left: seconds, total: seconds, scale, y }); if (says.length > 3) says.shift(); }
  function note(text, seconds = 1.4) { toast = { text, left: seconds }; }
  function clear() { says.length = 0; toast = null; dust.length = 0; }

  // ---- dials ----
  function disc(cx, cy, r, col) {
    for (let dy = -r; dy <= r; dy++) { const hw = Math.floor(Math.sqrt(r * r + r * 0.6 - dy * dy)); fill(cx - hw, cy + dy, hw * 2 + 1, 1, col); }
  }
  function seg(x0, y0, x1, y1, col) {
    const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))) || 1;
    for (let k = 0; k <= n; k++) fill(Math.round(x0 + (x1 - x0) * k / n), Math.round(y0 + (y1 - y0) * k / n), 1, 1, col);
  }
  const A0 = Math.PI * 1.25, SWEEP = Math.PI * 1.5;
  function dial(cx, cy, r, frac, max, major, minor, red, value, label) {
    disc(cx, cy, r + 1, INK); disc(cx, cy, r, '#2a2320'); disc(cx, cy, r - 1, '#1d1816');
    for (let k = 0; k * minor <= max + 1e-6; k++) {
      const val = k * minor, a = A0 - SWEEP * val / max, big = Math.abs(val / major - Math.round(val / major)) < 1e-6;
      const col = red != null && val >= red ? '#e0442e' : big ? CREAM : '#a89a8c';
      const r0 = r - (big ? 5 : 3);
      seg(cx + Math.cos(a) * r0, cy - Math.sin(a) * r0, cx + Math.cos(a) * (r - 2), cy - Math.sin(a) * (r - 2), col);
    }
    const a = A0 - SWEEP * clamp(frac, 0, 1);
    seg(cx, cy, cx + Math.cos(a) * (r - 3), cy - Math.sin(a) * (r - 3), '#ff5a3c');
    seg(cx + 1, cy, cx + 1 + Math.cos(a) * (r - 6), cy - Math.sin(a) * (r - 6), '#ff5a3c');
    fill(cx - 1, cy - 1, 3, 3, CREAM);
    drawText(ctx, value, cx, cy + Math.round(r * 0.42), CREAM, 1, 'center');
    drawTextShadow(ctx, label, cx, cy + r + 4, CREAM, 1, 'center', INK);
  }

  function hud(g, o) {
    // Bigger type on the taller phone canvas, where each game pixel is drawn smaller.
    const B = H > 220 ? 3 : 2, S = H > 220 ? 2 : 1, top = 6 + (o.hudTop || 0);
    // speedometer and rev counter, top left: two round dials like the bike's own
    const R = H > 220 ? 19 : 16, cy = top + R + 1, c1 = 7 + R, c2 = c1 + 2 * R + 8;
    const v = kmh(g);
    dial(c1, cy, R, v / 140, 140, 20, 10, null, String(v), 'KM/H');
    dial(c2, cy, R, (o.rpm || 1000) / 6000, 6, 1, 0.5, 5, 'G' + ((o.gear || 0) + 1), 'RPM');
    // place and time, top right
    const place = `${g.place}/${RIDERS}`;
    drawTextShadow(ctx, place, W - 6, top, CREAM, B, 'right', INK);
    drawTextShadow(ctx, 'POS', W - 9 - textWidth(place, B), top + 5 * (B - S), CREAM, S, 'right', INK);
    drawTextShadow(ctx, formatTime(g.t), W - 6, top + 5 * B + 4, CREAM, S, 'right', INK);
    // the duel: how far Shri is ahead or behind
    const lead = Math.round(shriLead(g));
    const gap = lead > 0 ? `SHRI ${lead} M AHEAD` : lead < 0 ? `SHRI ${-lead} M BEHIND` : 'SHRI ALONGSIDE';
    drawTextShadow(ctx, gap, W - 6, top + 5 * B + 4 + 5 * S + 4, lead > 0 ? '#f2c230' : '#9fe0a0', S, 'right', INK);
    // route, top centre
    const x0 = 104, x1 = 216, y = 8, r = g.route, len = r.finishIndex;
    fill(x0 - 1, y - 1, x1 - x0 + 3, 4, INK);
    fill(x0, y, x1 - x0 + 1, 2, '#6d655c');
    const px = Math.round(x0 + (x1 - x0) * progress(g));
    fill(x0, y, px - x0, 2, CREAM);
    for (const st of r.stages) if (st.start) fill(Math.round(x0 + (x1 - x0) * st.start / len), y - 2, 1, 6, CREAM);
    for (const c of g.cars) if (c.rider && !c.shri) fill(Math.round(x0 + (x1 - x0) * clamp(c.z / r.finishZ, 0, 1)), y, 1, 2, '#f2c230');
    const sx = Math.round(x0 + (x1 - x0) * clamp(g.shri.z / r.finishZ, 0, 1));
    fill(sx - 1, y - 2, 3, 6, '#1d2f66'); fill(sx, y - 1, 1, 4, '#c8281e');
    fill(px - 1, y - 2, 3, 6, '#842B22'); fill(px, y - 1, 1, 4, CREAM);
    drawTextShadow(ctx, r.stages[g.stage].name, 160, 15, CREAM, S, 'center', INK);
  }

  function draw(g, o = {}) {
    const dt = o.dt || 0;
    clock += dt;
    const p = g.player, segs = g.route.segs, last = segs.length - 1;
    const sp = p.speed / MAX_SPEED;
    const camZ = p.z - PLAYER_Z;
    const baseIdx = clamp(Math.floor(camZ / SEG), 0, last);
    const basePct = clamp((camZ - baseIdx * SEG) / SEG, 0, 1);
    const pSeg = segs[Math.min(last, Math.floor(p.z / SEG))];
    const pPct = (p.z - pSeg.i * SEG) / SEG;
    const camY = pSeg.y1 + (pSeg.y2 - pSeg.y1) * pPct + CAM_H;
    const camX = p.x * ROAD;
    const F = pSeg.fog;
    palette(progress(g));

    // backdrop
    skyOff += pSeg.curve * sp * dt * 16;
    const slope = (pSeg.y2 - pSeg.y1) / SEG;
    bgY += (clamp(slope * 28, -8, 8) - bgY) * Math.min(1, dt * 2.5);
    const y0 = (H >> 1) + Math.round(bgY);
    ctx.drawImage(sky, 0, 0);
    tile(skyLayer, skyOff * 0.12, Math.round(bgY * 0.4));
    for (let n = 0; n < 3; n++) tile(layers[n], skyOff * LAYER_SPEED[n], y0 - LAYER_H[n] + LAYER_DROP[n]);
    ctx.drawImage(floor, 0, y0 + LAYER_DROP[2]);
    if (F > 0.02) { ctx.globalAlpha = Math.min(0.94, F * 0.94); fill(0, 0, W, H, pal.haze); ctx.globalAlpha = 1; }

    // road, nearest first, one scanline at a time
    let x = 0, dx = -(segs[baseIdx].curve * basePct), maxy = H;
    const N = Math.min(DRAW, last - baseIdx);
    for (let n = 0; n <= N; n++) {
      const s = segs[baseIdx + n];
      const z1 = s.i * SEG - camZ, z2 = z1 + SEG;
      const X1 = x - camX, X2 = x + dx - camX;
      x += dx; dx += s.curve;
      s._vis = false;
      if (z1 < 1) continue;
      const sc1 = CAM_D / z1, sc2 = CAM_D / z2;
      const d = n / DRAW;
      s._f = clamp(Math.max(d * d * d * 0.55, F > 0 ? 1 - Math.exp(-d * d * 9 * F) : 0), 0, 1);
      s._X1 = X1; s._X2 = X2;
      s._sx1 = W / 2 + sc1 * X1 * W / 2; s._sx2 = W / 2 + sc2 * X2 * W / 2;
      s._y1 = H / 2 - sc1 * (s.y1 - camY) * H / 2; s._y2 = H / 2 - sc2 * (s.y2 - camY) * H / 2;
      s._w1 = sc1 * ROAD * W / 2; s._w2 = sc2 * ROAD * W / 2;
      s._clip = maxy; s._vis = true;
      const top = Math.max(0, Math.round(s._y2)), bot = Math.min(maxy, Math.round(s._y1));
      if (top >= bot) continue;

      const gp = GROUND[s.pal], band = ((s.i / 3) | 0) & 1, f = s._f;
      const cRoad = fogged(gp.road[band], f), cGrass = fogged(gp.grass[band], f), cVerge = fogged(gp.verge[band], f), cLine = fogged(gp.line, f);
      const cKerb = s.kerb ? fogged(gp.kerb[(s.i >> 1) & 1], f) : null, cWater = s.water ? fogged(gp.water[band], f) : null;
      const cRock = fogged(ROCK_FLOOR, f);
      const voidL = s.hill > 0, voidR = s.hill < 0 || s.view;
      const cLeft = s.hill < 0 ? cRock : cGrass, cRight = s.hill > 0 ? cRock : cGrass;
      const dash = Math.abs(s.curve) > 3 || (s.i % 6) < 3;
      const span = s._y1 - s._y2;
      for (let y = top; y < bot; y++) {
        const t = (y + 0.5 - s._y2) / span;
        const cx = s._sx2 + (s._sx1 - s._sx2) * t, w = s._w2 + (s._w1 - s._w2) * t;
        const l = Math.round(cx - w), r = Math.round(cx + w), vl = Math.round(cx - w * 1.3), vr = Math.round(cx + w * 1.3);
        if (!voidL) fill(0, y, vl, 1, cLeft);
        fill(vl, y, l - vl, 1, cVerge);
        fill(l, y, r - l, 1, cRoad);
        fill(r, y, vr - r, 1, cVerge);
        if (!voidR) {
          if (cWater) { const wx = Math.round(cx + w * 1.62); fill(vr, y, wx - vr, 1, cGrass); fill(wx, y, W - wx, 1, cWater); }
          else fill(vr, y, W - vr, 1, cRight);
        }
        if (cKerb) { const k = Math.max(1, Math.round(w * 0.09)); fill(l - k, y, k, 1, cKerb); fill(r, y, k, 1, cKerb); }
        if (w > 12) { const e = Math.max(1, Math.round(w * 0.035)); fill(Math.round(cx - w * 0.95), y, e, 1, cLine); fill(Math.round(cx + w * 0.95) - e, y, e, 1, cLine); }
        if (dash && w > 5) { const c = Math.max(1, Math.round(w * 0.03)); fill(Math.round(cx - c / 2), y, c, 1, cLine); }
      }
      // glints on the backwater
      if (cWater && band && bot - top < 6) {
        const wx = Math.round(s._sx1 + s._w1 * 1.62);
        for (let k = 0; k < 3; k++) { const gx = wx + 6 + ((s.i * 53 + k * 97 + ((clock * 3) | 0) * 31) % Math.max(8, W - wx - 6)); if (gx < W) fill(gx, top, 2, 1, fogged('#cfe6f5', f)); }
      }
      maxy = top;
    }

    // everything standing on the road, farthest first
    const tread = ((p.z / 90) | 0) & 1;
    pops.length = 0;
    for (let n = N; n >= 0; n--) {
      const s = segs[baseIdx + n];
      if (!s._vis) continue;
      const alpha = 1 - s._f * 0.96;
      if (s.hill) { wall(s, s.hill); rail(s, -s.hill); }
      else if (s.view) { rail(s, -1); rail(s, 1); }
      for (const sp2 of s.sprites) {
        let img = null, ww = SCENERY[sp2.kind].w;
        if (sp2.kind === 'sign') { img = art.sign(sp2.label); ww = img.width / 44; }
        else if (sp2.kind === 'arch') img = art.arch(sp2.label);
        else if (sp2.kind === 'fall') img = art.fall[((clock * 9) | 0) % 3];
        else img = art.scenery[sp2.kind];
        const sx = s._sx1 + sp2.offset * s._w1;
        const clip = sp2.up < 0 ? Math.min(s._clip, Math.round(s._y1)) : s._clip;
        blit(img, ww, s._w1, sx, s._y1, clip, alpha, sp2.up || 0, sp2.flip);
      }
      if (s.cars.length) {
        const list = s.cars.length > 1 ? s.cars.slice().sort((a, b) => b.z - a.z) : s.cars;
        const mine = s === pSeg;
        for (const c of list) { if (!mine || c.z >= p.z) car(c, s, camZ, camY, alpha); }
        if (mine) { rider(g, o, tread); for (const c of list) if (c.z < p.z) car(c, s, camZ, camY, alpha); }
      } else if (s === pSeg) rider(g, o, tread);
    }

    // mist drifting across the road
    if (F > 0.25) {
      ctx.globalAlpha = Math.min(0.3, F * 0.3);
      for (let k = 0; k < 3; k++) {
        const wx = ((clock * (7 + k * 4) + k * 190) % (W + 300)) - 280;
        ctx.drawImage(art.wisp, Math.round(wx), Math.round(H * (0.36 + k * 0.1)), 280, 26);
      }
      ctx.globalAlpha = 1;
    }
    // the colour of the light
    if (pal.tint !== '#ffffff') { ctx.globalCompositeOperation = 'multiply'; fill(0, 0, W, H, pal.tint); ctx.globalCompositeOperation = 'source-over'; }

    // dust
    for (let k = dust.length - 1; k >= 0; k--) {
      const d = dust[k];
      d.life -= dt; d.x += d.vx * dt; d.y += d.vy * dt;
      if (d.life <= 0) { dust.splice(k, 1); continue; }
      fill(Math.round(d.x), Math.round(d.y), d.size, d.size, d.col);
    }

    // Thars: a speech bubble or a PAAP! over the ones in view, and a warning for one honking out of sight behind you.
    // Like the HUD, the words are drawn twice the size on the taller phone canvas, where each game pixel is smallest.
    const shake = o.reduced ? 0 : ((clock * 24) | 0) % 2, T = H > 220 ? 2 : 1;
    for (const q of pops) {
      if (q.say) bubble(q.x, q.y, THAR_LINE, T);
      else drawTextShadow(ctx, 'PAAP!', Math.round(q.x) + shake, Math.max(2, q.y - 6 - 3 * T), '#f2c230', T, 'center', INK);
    }
    let behind = null;
    for (const c of g.cars) if (c.thar && c.active && c.honk > 0 && c.z - camZ < 60 && p.z - c.z < 34 * SEG) behind = c;
    if (behind) {
      const right = behind.offset > p.x, x = right ? W - 8 : 8, y = H - 10 - 12 * T, align = right ? 'right' : 'left';
      drawTextShadow(ctx, 'PAAP PAAP!', x + (right ? -shake : shake), y, '#f2c230', T, align, INK);
      drawTextShadow(ctx, 'THAR BEHIND', x, y + 6 * T + 2, CREAM, T, align, INK);
    }

    if (o.hud) hud(g, o);
    if (g.phase === 'count' && o.hud) {
      const n = String(Math.ceil(g.count)), cy = Math.round(H * 0.4);
      fill(W / 2 - 22, cy - 6, 44, 42, '#611E17'); fill(W / 2 - 20, cy - 4, 40, 38, '#842B22');
      drawText(ctx, n, W / 2, cy, n === '1' ? '#f2c230' : CREAM, 6, 'center');
    }
    for (let k = says.length - 1; k >= 0; k--) {
      const m = says[k];
      m.left -= dt;
      if (m.left <= 0) { says.splice(k, 1); continue; }
      const age = m.total - m.left;
      if (age < 0.08 && !o.reduced && ((clock * 30) | 0) % 2) continue;
      const w = textWidth(m.text, m.scale) + 10 * m.scale / 2, y = Math.round(H * m.y);
      fill(Math.round(W / 2 - w / 2), y - 3, Math.round(w), 5 * m.scale + 6, '#842B22');
      fill(Math.round(W / 2 - w / 2), y + 5 * m.scale + 3, Math.round(w), 1, '#611E17');
      drawText(ctx, m.text, W / 2, y, CREAM, m.scale, 'center');
    }
    if (toast) {
      toast.left -= dt;
      if (toast.left <= 0) toast = null;
      else drawTextShadow(ctx, toast.text, W / 2, Math.round(H * 0.62), '#f2c230', 2, 'center', INK);
    }
  }

  function car(c, s, camZ, camY, alpha) {
    const z = c.z - camZ;
    if (z < 60) return;
    const pct = (c.z - s.i * SEG) / SEG, sc = CAM_D / z, wpx = sc * ROAD * W / 2;
    const sx = W / 2 + sc * (s._X1 + (s._X2 - s._X1) * pct) * W / 2 + c.offset * wpx;
    const sy = H / 2 - sc * (s.y1 + (s.y2 - s.y1) * pct - camY) * H / 2;
    let img, ww = VEHICLES[c.kind].w, flip = false;
    if (c.rider) {
      const tilt = clamp(Math.round(s.curve * (c.speed / MAX_SPEED) * 0.45), -2, 2) + 2;
      img = c.shri ? art.shri[tilt] : art.rivals[c.v % art.rivals.length][tilt];
      ww = img.width / LANE_PX;
    } else {
      const set = art.veh[c.kind][c.dir < 0 ? 'front' : 'rear'];
      img = set[c.v % set.length];
      if (c.kind === 'cow') flip = !!c.flip;
    }
    blit(img, ww, wpx, sx, sy, s._clip, alpha, 0, flip);
    if (c.thar && alpha > 0.35 && (c.say > 0 || c.honk > 0)) {
      const top = Math.round(sy - ww * wpx * img.height / img.width);
      if (sx > -20 && sx < W + 20 && top < s._clip) pops.push({ x: sx, y: top, say: c.say > 0 });
    }
    if (c.shri && alpha > 0.25) {
      // a small name tag over his helmet, so he can be picked out of the field at a distance
      const top = Math.round(sy - ww * wpx * img.height / img.width) - 9, tx = Math.round(sx);
      if (top > 26 && top < s._clip - 8 && tx > 12 && tx < W - 12) {
        fill(tx - 10, top - 1, 20, 7, '#1d2f66'); fill(tx, top + 6, 1, 2, '#1d2f66');
        drawText(ctx, 'SHRI', tx, top, CREAM, 1, 'center');
      }
    }
  }

  // A pixel speech bubble, its tail pointing down at whoever is talking. It stays on screen.
  function bubble(x, top, lines, s = 1) {
    const w = Math.max(...lines.map(l => textWidth(l, s))) + 4 + 4 * s, h = lines.length * 7 * s + 2 + 2 * s;
    const bx = clamp(Math.round(x - w / 2), 3, W - w - 3), by = clamp(Math.round(top - h - 5), 2, H - h - 30);
    fill(bx - 1, by - 1, w + 2, h + 2, INK);
    fill(bx, by, w, h, CREAM);
    const tx = clamp(Math.round(x), bx + 3, bx + w - 4);
    fill(tx - 2, by + h, 5, 1, INK); fill(tx - 1, by + h, 3, 1, CREAM);
    fill(tx - 1, by + h + 1, 3, 1, INK); fill(tx, by + h + 1, 1, 1, CREAM);
    fill(tx, by + h + 2, 1, 1, INK);
    lines.forEach((line, k) => drawText(ctx, line, bx + w / 2, by + 1 + 2 * s + k * 7 * s, k ? INK : '#842B22', s, 'center'));
  }

  function rider(g, o, tread) {
    const p = g.player, sp = p.speed / MAX_SPEED;
    let idx = clamp(Math.round(p.lean * 2), -2, 2) + 2;
    let bob = 0;
    if (p.spill > 0) { idx = ((clock * 14) | 0) % 2 ? 0 : 4; bob = ((clock * 20) | 0) % 2; }
    else if (p.safe > 0 && ((clock * 12) | 0) % 2) return;
    else if (p.off && sp > 0.05) bob = ((clock * 24) | 0) % 2;
    else if (sp < 0.02) bob = ((clock * 7) | 0) % 2;
    else bob = ((clock * 3.2) | 0) % 2 && sp < 0.5 ? 1 : 0;
    const img = (p.brake && p.spill <= 0 ? art.player.brake : art.player.ride)[sp > 0.02 ? tread : 0][idx];
    const px = Math.round(W / 2 - img.width / 2), py = H - 2 - img.height + bob;
    ctx.globalAlpha = 0.3; fill(W / 2 - 10, H - 4, 21, 3, '#000000'); fill(W / 2 - 7, H - 1, 15, 1, '#000000'); ctx.globalAlpha = 1;
    ctx.drawImage(img, px, py);
    if (p.off && sp > 0.08 && !o.reduced && dust.length < 60) {
      for (let k = 0; k < 2; k++) dust.push({ x: W / 2 - 3 + Math.random() * 6, y: H - 6, vx: (Math.random() - 0.5) * 60, vy: -20 - Math.random() * 40, life: 0.25 + Math.random() * 0.3, size: 1 + (Math.random() * 2 | 0), col: Math.random() < 0.5 ? '#c9764a' : '#a85a38' });
    }
  }

  setSize(H);
  return { setSize, draw, say, note, clear, get height() { return H; } };
}
