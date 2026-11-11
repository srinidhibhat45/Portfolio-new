// Sunday Ride: every picture in the game, drawn in code onto small canvases.
// Nothing here loads a file. Sprites are built once at start-up and scaled by the renderer.

import { drawText, drawPlate, textWidth } from './font.js?v=20261112-ride-2';

function blank(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

class Pen {
  constructor(w, h) { this.c = blank(w, h); this.g = this.c.getContext('2d'); this.w = w; this.h = h; }
  r(x, y, w, h, col) { this.g.fillStyle = col; this.g.fillRect(x, y, w, h); return this; }
  p(x, y, col) { return this.r(x, y, 1, 1, col); }
  // The same rectangle on both sides of the centre line.
  s(x, y, w, h, col) { this.r(x, y, w, h, col); return this.r(this.w - x - w, y, w, h, col); }
  cut(x, y, w = 1, h = 1) { this.g.clearRect(x, y, w, h); return this; }
  cuts(x, y, w = 1, h = 1) { this.cut(x, y, w, h); return this.cut(this.w - x - w, y, w, h); }
  disc(cx, cy, rad, col) {
    for (let dy = -rad; dy <= rad; dy++) {
      const hw = Math.floor(Math.sqrt(rad * rad + rad * 0.6 - dy * dy));
      this.r(cx - hw, cy + dy, hw * 2 + 1, 1, col);
    }
    return this;
  }
  ell(cx, cy, rx, ry, col) {
    for (let dy = -ry; dy <= ry; dy++) {
      const hw = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry + ry * 0.5))));
      this.r(cx - hw, cy + dy, hw * 2 + 1, 1, col);
    }
    return this;
  }
  line(x0, y0, x1, y1, col) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
    for (let k = 0; k <= n; k++) this.p(Math.round(x0 + (x1 - x0) * k / n), Math.round(y0 + (y1 - y0) * k / n), col);
    return this;
  }
  dither(x, y, w, h, col, phase = 0) {
    this.g.fillStyle = col;
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if ((xx + yy + phase) & 1) this.g.fillRect(xx, yy, 1, 1);
    return this;
  }
  text(str, x, y, col, scale = 1, align = 'left') { drawText(this.g, str, x, y, col, scale, align); return this; }
}

const C = {
  tyre: '#17171b', tyreHi: '#3b3b46', chromeHi: '#f3f6f9', chrome: '#b9c2cc', chromeLo: '#77818e',
  seat: '#6b3f26', seatHi: '#91603c', lamp: '#b71d18', lampOn: '#ff4a2e', lampGlow: '#ffb49c', amber: '#f0a020',
  plate: '#f3f2ea', yplate: '#f2c230', ink: '#23232b', glass: '#a6cdea', glassLo: '#3f5f7a', skin: '#8d5a3b', shoe: '#2b2b31', sole: '#cfcfcf',
  light: '#fff3b0', lightHi: '#fffdf0',
};

// The player's bike: Kaavi red with a cream helmet, so it belongs to the site and is plainly not Shri's.
const YOU = {
  helmet: '#F6F0E4', helmetHi: '#ffffff', band: '#842B22', top: '#2b2624', topHi: '#463e3a', stripe: '#F6F0E4', stripe2: '#842B22',
  jeans: '#3a4660', jeansLo: '#283247', bike: '#842B22', bikeHi: '#c4574a', glove: '#1b1b20', fender: '#9a3329', fenderHi: '#c4574a', fenderLo: '#611E17', seat: '#842B22', seatHi: '#c4574a',
};

// Shri on the blue 350, the one to beat: black helmet, navy top with the red and white stripe, grey jeans, red bag on the back seat.
const SHRI = {
  helmet: '#18181c', helmetHi: '#4a4a57', band: '#842B22', top: '#1c2748', topHi: '#2f3d70', stripe: '#d8322a', stripe2: '#f2f0ea',
  jeans: '#646b76', jeansLo: '#484e58', bike: '#1d2f66', bikeHi: '#4a7be0', glove: '#1b1b20', short: true,
  bag: '#c8281e', bagHi: '#ee6046', bagLo: '#931a10', bagDot: '#f2c230',
};

const RIVALS = [
  { helmet: '#f1efe6', helmetHi: '#ffffff', band: '#23232b', top: '#e2b41f', topHi: '#f6d65a', stripe: '#23232b', stripe2: '#e2b41f', jeans: '#3d4450', jeansLo: '#2b3039', bike: '#23232b', bikeHi: '#5a5a66', glove: '#1b1b20' },
  { helmet: '#e2701c', helmetHi: '#f8a25a', band: '#23232b', top: '#2a2a31', topHi: '#45454f', stripe: '#e2701c', stripe2: '#2a2a31', jeans: '#4b5360', jeansLo: '#353b45', bike: '#d5651a', bikeHi: '#f79a4c', glove: '#1b1b20' },
  { helmet: '#2f8a4a', helmetHi: '#63c07e', band: '#f1efe6', top: '#8a929c', topHi: '#b3bac3', stripe: '#2f8a4a', stripe2: '#8a929c', jeans: '#2b2f37', jeansLo: '#1d2026', bike: '#237a3f', bikeHi: '#58b874', glove: '#1b1b20' },
  { helmet: '#ececec', helmetHi: '#ffffff', band: '#2a6fc0', top: '#2a6fc0', topHi: '#5b9be6', stripe: '#f1efe6', stripe2: '#2a6fc0', jeans: '#3a404b', jeansLo: '#282c35', bike: '#e6e4dc', bikeHi: '#ffffff', glove: '#1b1b20' },
  { helmet: '#23232b', helmetHi: '#52525f', band: '#e6c21f', top: '#7a4a2c', topHi: '#a26a42', stripe: '#e6c21f', stripe2: '#7a4a2c', jeans: '#565d68', jeansLo: '#3d434c', bike: '#d9b51a', bikeHi: '#f6dc62', glove: '#1b1b20' },
  { helmet: '#7a2a8a', helmetHi: '#b060c0', band: '#f1efe6', top: '#1f8a88', topHi: '#4cc0bc', stripe: '#f1efe6', stripe2: '#1f8a88', jeans: '#2e3138', jeansLo: '#1f2228', bike: '#4a4f58', bikeHi: '#8a909a', glove: '#1b1b20' },
];

const RW = 41, RH = 60;

function drawRider(k, o = {}) {
  const P = new Pen(RW, RH);
  // rear tyre
  P.r(17, 41, 7, 18, C.tyre).r(18, 59, 5, 1, C.tyre);
  for (let y = 44 + (o.tread ? 2 : 0); y < 59; y += 4) P.r(19, y, 3, 1, C.tyreHi);
  // twin shocks and the swingarm
  P.s(13, 38, 2, 11, C.chromeLo);
  for (let y = 39; y < 48; y += 2) P.s(13, y, 2, 1, C.chrome);
  P.s(14, 50, 3, 2, C.chromeLo);
  // one chrome exhaust, on the right
  P.r(26, 46, 10, 6, C.chrome).r(26, 46, 10, 1, C.chromeHi).r(26, 51, 10, 1, C.chromeLo).cut(35, 46).cut(35, 51).cut(26, 46).cut(26, 51);
  P.r(30, 48, 4, 2, '#2a2a30').r(31, 48, 2, 2, '#0c0c10');
  // legs and boots
  P.s(9, 27, 6, 9, k.jeans).s(8, 34, 5, 10, k.jeans).s(8, 30, 1, 14, k.jeansLo).s(9, 27, 1, 3, k.jeansLo);
  P.s(7, 43, 6, 3, C.shoe).s(7, 46, 6, 1, C.sole);
  // side panels, seat, rear mudguard
  P.s(12, 29, 4, 9, k.bike).s(12, 30, 1, 7, k.bikeHi).s(13, 33, 2, 1, k.bikeHi);
  // the tank's flanks, either side of the rider
  P.s(10, 20, 3, 8, k.bike).s(10, 20, 3, 1, k.bikeHi).s(10, 21, 1, 6, k.bikeHi);
  P.r(13, 30, 15, 4, k.seat || C.seat).r(13, 30, 15, 1, k.seatHi || C.seatHi);
  P.r(16, 35, 9, 7, k.fender || C.chrome).r(17, 34, 7, 1, k.fenderHi || C.chromeHi).r(16, 35, 1, 7, k.fenderHi || C.chromeHi).r(24, 35, 1, 7, k.fenderLo || C.chromeLo);
  if (k.fender) P.s(11, 46, 3, 3, k.fender).s(11, 46, 3, 1, k.fenderHi);      // painted side stays below the plate
  // tail lamp, indicators, plate
  P.r(18, 34, 5, 3, o.brake ? C.lampOn : C.lamp);
  if (o.brake) P.r(17, 33, 7, 1, C.lampGlow).p(17, 35, C.lampGlow).p(23, 35, C.lampGlow).r(19, 35, 3, 1, '#fff0e0');
  else P.p(19, 35, '#e8584e');
  P.s(14, 35, 2, 2, C.amber);
  // number plate: four fixed-width characters, or fewer centred
  const plate = String(o.plate || '').slice(0, 4);
  P.r(10, 37, 21, 9, C.ink).r(11, 38, 19, 7, C.plate);
  drawPlate(P.g, plate, 13 + (4 - plate.length) * 2, 39, C.ink);
  // torso and shoulders
  P.r(13, 10, 15, 17, k.top).s(10, 11, 4, 5, k.top).cuts(10, 11).r(14, 10, 13, 1, k.topHi);
  P.r(10, 14, 21, 2, k.stripe).r(10, 16, 21, 1, k.stripe2);
  // arms out to the bars
  P.s(9, 13, 3, 6, k.top).s(9, 14, 3, 2, k.stripe).s(9, 16, 3, 1, k.stripe2);
  const arm = k.short ? C.skin : k.top;
  P.s(8, 17, 3, 2, arm).s(7, 18, 3, 6, arm).s(5, 23, 4, 3, k.glove);
  // bar ends and round mirrors
  P.s(3, 25, 4, 1, C.chromeLo).s(4, 16, 1, 8, C.chromeLo);
  P.s(1, 11, 6, 5, C.tyre).s(2, 12, 4, 3, C.glass).s(2, 12, 2, 1, '#e6f3fb').cuts(1, 11).cuts(1, 15).cuts(6, 11).cuts(6, 15);
  if (k.bag) {
    // the red bag bungeed to the back seat
    P.r(13, 19, 15, 12, k.bag).r(14, 18, 13, 1, k.bagHi).r(13, 30, 15, 1, k.bagLo).cut(13, 19).cut(27, 19);
    P.r(14, 19, 13, 1, k.bagHi);
    for (let y = 21; y < 30; y += 3) for (let x = 15 + ((y / 3 | 0) & 1) * 2; x < 27; x += 4) P.p(x, y, k.bagDot);
    P.r(16, 18, 1, 13, C.ink).r(24, 18, 1, 13, C.ink).r(13, 25, 15, 1, k.bagLo);
  } else {
    P.r(14, 26, 13, 4, k.top).r(14, 29, 13, 1, C.ink);
    if (k.seat) P.r(13, 27, 15, 3, k.seat).r(13, 27, 15, 1, k.seatHi);       // a painted seat cowl behind the rider
  }
  // helmet
  P.disc(20, 6, 6, k.helmet).r(15, 9, 11, 3, k.helmet);
  P.r(16, 2, 3, 1, k.helmetHi).r(15, 3, 1, 3, k.helmetHi).r(16, 10, 9, 1, k.band);
  return P.c;
}

// Lean a sprite by sliding its rows sideways; the tyre's contact patch stays put.
const LEAN = [-0.26, -0.13, 0, 0.13, 0.26];
const PAD = 16;
function lean(src, k) {
  const out = blank(src.width + PAD * 2, src.height), g = out.getContext('2d');
  for (let y = 0; y < src.height; y++) g.drawImage(src, 0, y, src.width, 1, PAD + Math.round((src.height - 1 - y) * k), y, src.width, 1);
  return out;
}
const leanSet = src => LEAN.map(k => lean(src, k));

function lorry(front, v) {
  const P = new Pen(57, 58);
  const body = ['#d9812b', '#2f7fb6', '#c9432a', '#3d8f58'][v % 4], trim = ['#7a3d12', '#173f60', '#6a1c10', '#1c4a2c'][v % 4];
  const panel = '#f3ecd6', tarp = ['#3a6ea5', '#5a7d3c', '#8a6a3a', '#4c5a66'][v % 4], tarpHi = ['#6a9ad0', '#86a860', '#b8925a', '#75848f'][v % 4];
  P.s(6, 44, 11, 14, C.tyre).s(8, 47, 2, 9, C.tyreHi);
  if (!front) {
    P.r(22, 46, 13, 7, '#2a2a30').r(5, 40, 47, 6, '#3a2c26');
    P.s(7, 41, 5, 3, C.lamp).s(13, 41, 3, 3, C.amber);
    P.r(22, 41, 13, 4, C.yplate).r(24, 42, 9, 1, C.ink);
    P.s(6, 46, 11, 8, '#1d1d22').s(9, 48, 5, 3, '#e8e2d2');
    P.r(3, 8, 51, 32, body);
    P.r(3, 8, 51, 1, trim).r(3, 39, 51, 1, trim).r(3, 8, 1, 32, trim).r(53, 8, 1, 32, trim);
    P.r(4, 9, 49, 5, '#f2c230');
    for (let x = 6; x < 52; x += 4) P.p(x, 11, C.lamp);
    P.r(13, 15, 31, 15, panel).r(13, 15, 31, 1, trim).r(13, 29, 31, 1, trim);
    P.text('HORN OK', 28, 17, C.ink, 1, 'center').text('PLEASE', 28, 23, '#b3241e', 1, 'center');
    P.s(5, 15, 7, 15, trim).s(7, 19, 3, 7, '#f2c230').s(8, 21, 1, 3, C.lamp);
    P.r(4, 31, 49, 8, body).r(4, 31, 49, 1, trim);
    for (let x = 7; x < 50; x += 6) P.r(x, 33, 3, 4, '#f2c230').p(x + 1, 34, C.lamp);
    P.s(13, 30, 1, 10, C.chromeLo);
    P.r(5, 2, 47, 7, tarp).r(7, 0, 43, 2, tarp).r(9, 1, 34, 1, tarpHi).r(5, 8, 47, 1, '#22262c');
    for (const x of [14, 28, 42]) P.r(x, 0, 1, 9, '#d8cfae');
  } else {
    P.r(3, 40, 51, 5, C.yplate);
    for (let x = 5; x < 52; x += 6) P.r(x, 40, 3, 5, C.ink);
    P.r(5, 12, 47, 28, body).r(5, 12, 47, 1, trim).r(5, 12, 1, 28, trim).r(51, 12, 1, 28, trim);
    P.r(7, 2, 43, 10, '#f2c230').r(7, 2, 43, 1, trim).r(7, 11, 43, 1, trim).r(7, 2, 1, 10, trim).r(49, 2, 1, 10, trim);
    P.text('KONKAN', 28, 5, '#b3241e', 1, 'center');
    P.r(8, 14, 41, 12, C.glassLo).r(28, 14, 1, 12, body);
    P.line(11, 23, 18, 15, C.glass).line(13, 24, 21, 15, C.glass).line(33, 23, 39, 16, C.glass);
    P.r(8, 26, 41, 1, trim);
    for (let x = 9; x < 48; x += 3) P.p(x, 27, ['#f2c230', '#c9302a', '#3d8f58'][(x / 3 | 0) % 3]);
    P.r(17, 30, 23, 8, '#2a2a30').r(17, 32, 23, 1, C.chrome).r(17, 35, 23, 1, C.chrome);
    P.s(8, 30, 7, 6, C.light).s(9, 31, 5, 4, C.lightHi).s(9, 37, 4, 2, C.amber);
    P.s(1, 15, 3, 8, C.ink).s(1, 16, 2, 5, C.glass);
    P.r(21, 39, 15, 3, C.yplate);
  }
  return P.c;
}

function bus(front, v) {
  const P = new Pen(55, 60);
  const body = ['#f1ead6', '#e9e5db', '#f1ead6', '#dfe7e4'][v % 4], band = ['#2f8a4a', '#c9302a', '#2a6fc0', '#e2701c'][v % 4], lo = '#b7ae98';
  P.s(6, 48, 9, 12, C.tyre).s(8, 51, 2, 7, C.tyreHi);
  P.r(3, 3, 49, 46, body).r(5, 1, 45, 2, body).r(3, 3, 1, 46, lo).r(51, 3, 1, 46, lo);
  if (!front) {
    P.r(8, 7, 39, 15, C.glassLo).r(8, 7, 39, 1, C.ink).r(8, 21, 39, 1, C.ink);
    P.line(12, 19, 22, 9, C.glass).line(15, 20, 26, 9, C.glass);
    P.r(3, 25, 49, 7, band).r(3, 33, 49, 1, band);
    for (let y = 37; y < 44; y += 2) P.r(19, y, 17, 1, lo);
    P.s(5, 37, 5, 6, C.lamp).s(5, 35, 5, 2, C.amber);
    P.r(21, 44, 13, 4, C.yplate).r(23, 45, 9, 1, C.ink);
    P.r(3, 47, 49, 3, '#3a3a40');
    P.r(44, 6, 1, 38, C.chromeLo).r(48, 6, 1, 38, C.chromeLo);
    for (let y = 9; y < 44; y += 5) P.r(44, y, 5, 1, C.chromeLo);
  } else {
    P.r(11, 4, 33, 7, '#1c1c22').text('PANAJI', 27, 5, C.yplate, 1, 'center');
    P.r(6, 12, 43, 18, C.glassLo).r(27, 12, 1, 18, body);
    P.line(9, 27, 20, 14, C.glass).line(12, 28, 24, 14, C.glass).line(33, 26, 43, 15, C.glass);
    P.r(31, 22, 7, 8, '#22262c').disc(34, 21, 2, C.skin);
    P.r(3, 31, 49, 6, band);
    P.s(6, 39, 7, 5, C.light).s(7, 40, 5, 3, C.lightHi);
    P.r(18, 39, 19, 6, '#2a2a30').r(18, 41, 19, 1, C.chromeLo);
    P.r(2, 46, 51, 4, '#3a3a40').r(21, 46, 13, 3, C.yplate);
    P.s(0, 14, 3, 9, C.ink);
  }
  return P.c;
}

function auto(front) {
  const P = new Pen(35, 42);
  const yel = '#f2c230', yelLo = '#c99a16', blk = '#1f1f25';
  if (!front) {
    P.s(3, 32, 6, 10, C.tyre);
    P.r(3, 19, 29, 15, yel).r(3, 31, 29, 3, yelLo);
    P.r(4, 4, 27, 16, blk).r(6, 2, 23, 2, blk).r(5, 5, 25, 1, '#3a3a44');
    P.r(11, 8, 13, 6, '#5a6672').r(12, 9, 4, 1, C.glass);
    P.s(5, 23, 3, 4, C.lamp).s(5, 21, 3, 2, C.amber);
    P.r(12, 26, 11, 4, C.yplate).r(14, 27, 7, 1, C.ink);
    P.r(3, 34, 29, 2, '#2a2a30');
  } else {
    P.r(14, 31, 7, 11, C.tyre).r(12, 29, 11, 4, yel);
    P.r(4, 16, 27, 15, yel).r(4, 28, 27, 3, yelLo);
    P.r(4, 3, 27, 14, blk).r(6, 1, 23, 2, blk);
    P.r(7, 5, 21, 10, C.glassLo).line(9, 13, 15, 6, C.glass).line(12, 14, 18, 6, C.glass);
    P.r(14, 18, 7, 6, C.light).r(15, 19, 5, 4, C.lightHi);
    P.s(6, 20, 3, 3, C.amber);
    P.s(2, 6, 2, 5, C.ink);
  }
  return P.c;
}

function hatch(front, v) {
  const P = new Pen(41, 31);
  const col = ['#ece9e0', '#b3241e', '#9aa3ad', '#2f5fa8'][v % 4], lo = ['#b9b5a8', '#7a1712', '#6c747e', '#1e3f74'][v % 4];
  P.s(4, 24, 7, 7, C.tyre);
  P.r(2, 10, 37, 15, col).cuts(2, 10).r(7, 2, 27, 9, col).cuts(7, 2).r(2, 21, 37, 4, lo);
  P.r(9, 4, 23, 7, C.glassLo);
  if (!front) {
    P.line(11, 9, 16, 5, C.glass).line(13, 10, 19, 5, C.glass);
    P.s(3, 13, 6, 4, C.lamp).s(3, 13, 6, 1, '#e8584e');
    P.r(15, 16, 11, 4, C.plate).r(17, 17, 7, 1, C.ink);
  } else {
    P.line(11, 9, 17, 5, C.glass).line(14, 10, 20, 5, C.glass).line(25, 9, 30, 5, C.glass);
    P.s(3, 13, 7, 4, C.light).s(4, 14, 5, 2, C.lightHi);
    P.r(13, 14, 15, 4, '#2a2a30').r(13, 16, 15, 1, C.chromeLo);
    P.r(15, 21, 11, 3, C.plate);
  }
  return P.c;
}

function scooter(v) {
  const P = new Pen(25, 46);
  const col = ['#2aa39a', '#d8322a', '#e9e5db', '#6a5acd'][v % 4], shirt = ['#f1efe6', '#3a6ea5', '#c9a227', '#7c3b2e'][v % 4];
  P.r(10, 35, 5, 11, C.tyre);
  P.r(6, 24, 13, 12, col).cuts(6, 24).r(6, 34, 13, 2, C.ink);
  P.r(10, 26, 5, 3, C.lamp).r(8, 30, 9, 4, C.plate).r(10, 31, 5, 1, C.ink);
  P.s(4, 22, 4, 10, '#4b5360').s(3, 31, 4, 2, C.shoe);
  P.r(7, 9, 11, 15, shirt).s(4, 11, 3, 8, shirt).s(3, 18, 3, 2, C.skin);
  P.s(1, 8, 3, 3, C.ink).s(2, 11, 1, 8, C.chromeLo);
  P.disc(12, 5, 5, '#2a2a31').r(9, 2, 2, 1, '#5a5a66');
  return P.c;
}

function cow(v) {
  const P = new Pen(47, 31);
  const col = ['#efe9dc', '#9a6a44', '#efe9dc', '#3d3530'][v % 4], lo = ['#c9c1b0', '#74492c', '#c9c1b0', '#24201d'][v % 4];
  for (const x of [10, 15, 29, 34]) P.r(x, 19, 3, 11, x === 15 || x === 29 ? lo : col).r(x, 29, 3, 2, '#2a2420');
  P.r(8, 8, 31, 13, col).cut(8, 8).cut(38, 8).cut(38, 20).r(10, 19, 27, 2, lo);
  P.r(13, 5, 8, 4, col).cut(13, 5).cut(20, 5);
  P.r(2, 6, 9, 9, col).cut(2, 6).r(1, 11, 5, 4, '#d9a79a').p(2, 12, C.ink);
  P.p(5, 8, C.ink).r(9, 7, 3, 2, lo);
  P.r(3, 3, 1, 3, '#e8dcc0').r(8, 3, 1, 3, '#e8dcc0').p(2, 2, '#e8dcc0').p(9, 2, '#e8dcc0');
  P.r(39, 9, 1, 12, lo).r(38, 20, 3, 3, '#2a2420');
  P.r(26, 21, 4, 2, '#d9a79a');
  if (v % 4 === 2) P.r(18, 10, 8, 6, '#6a4630').r(30, 12, 5, 5, '#6a4630').r(4, 7, 3, 3, '#6a4630');
  return P.c;
}

function palm() {
  const P = new Pen(49, 100);
  let tx = 28;
  for (let y = 99; y >= 30; y--) {
    tx = 28 - Math.round(7 * Math.pow((99 - y) / 69, 1.7));
    const wide = y > 92 ? 4 : 3;
    P.r(tx, y, wide, 1, y % 5 === 0 ? '#5d4a3a' : '#8a7460').p(tx, y, '#a8927a');
  }
  const cx = tx + 1, cy = 29;
  const fronds = [[-178, 21, 22], [-152, 23, 15], [-124, 20, 7], [-98, 17, 3], [-76, 18, 4], [-50, 21, 9], [-24, 23, 16], [2, 21, 23]];
  for (const [deg, len, droop] of fronds) {
    const a = deg * Math.PI / 180;
    for (let k = 0; k <= len * 2; k++) {
      const t = k / (len * 2);
      const x = Math.round(cx + Math.cos(a) * len * t), y = Math.round(cy + Math.sin(a) * len * t + droop * t * t);
      const hang = 2 + Math.round(4 * Math.sin(Math.PI * Math.min(1, t * 1.1)));
      for (let j = hang; j >= 1; j--) P.p(x, y + j, j > 2 ? '#1f6a34' : '#2f8a3f');
      P.p(x, y, '#63b84c');
    }
  }
  P.disc(cx - 2, cy + 3, 2, '#6a4a2a').disc(cx + 2, cy + 4, 2, '#7a5630').p(cx - 3, cy + 2, '#a07a4a');
  return P.c;
}

function tree() {
  const P = new Pen(65, 78);
  P.r(29, 44, 7, 34, '#5a4030').r(29, 44, 2, 34, '#74543c').r(26, 75, 13, 3, '#5a4030');
  P.line(32, 48, 22, 38, '#5a4030').line(33, 48, 44, 38, '#5a4030');
  const dark = '#1f5c33', mid = '#2f7d3c', hi = '#58a84a';
  for (const [x, y, r] of [[32, 28, 21], [16, 34, 13], [48, 34, 13], [24, 16, 13], [41, 15, 13]]) P.disc(x, y, r, dark);
  for (const [x, y, r] of [[30, 25, 18], [15, 31, 10], [46, 31, 10], [23, 14, 10], [39, 13, 10]]) P.disc(x, y, r, mid);
  for (const [x, y, r] of [[25, 18, 8], [12, 28, 5], [41, 26, 6], [20, 10, 5], [36, 9, 6]]) P.disc(x, y, r, hi);
  P.dither(8, 34, 50, 14, dark);
  return P.c;
}

function bush() {
  const P = new Pen(27, 16);
  P.disc(8, 10, 6, '#236b36').disc(18, 10, 6, '#236b36').disc(13, 7, 6, '#2f8a3f').disc(10, 6, 3, '#63b84c').disc(19, 8, 2, '#63b84c');
  P.cut(0, 15, 27, 1);
  return P.c;
}

function grass() {
  const P = new Pen(15, 13);
  for (const [x, h, c] of [[1, 6, '#b9a34a'], [3, 10, '#8aa23c'], [5, 12, '#c9b55a'], [7, 9, '#7a9a38'], [9, 13, '#b9a34a'], [11, 8, '#8aa23c'], [13, 6, '#c9b55a']]) P.line(x, 12, x + ((x % 4) - 1), 13 - h, c);
  return P.c;
}

function rock() {
  const P = new Pen(29, 19);
  const rows = [[9, 9], [6, 16], [4, 20], [3, 23], [2, 25], [1, 27], [1, 27], [0, 29], [0, 29], [0, 29], [0, 29], [0, 29], [1, 28], [1, 28], [1, 27], [2, 26], [2, 25], [3, 23], [5, 19]];
  rows.forEach(([x, w], y) => P.r(x, y, w, 1, '#8f4a2c'));
  P.r(8, 1, 9, 2, '#b86a42').r(5, 3, 8, 3, '#b86a42').r(3, 6, 5, 3, '#a85a38').dither(12, 9, 16, 8, '#6a3520').r(4, 15, 20, 2, '#6a3520');
  return P.c;
}

function stone() {
  const P = new Pen(11, 17);
  P.r(1, 2, 9, 15, '#f1efe6').r(2, 1, 7, 1, C.yplate).r(3, 0, 5, 1, C.yplate).r(1, 2, 9, 7, C.yplate).r(1, 16, 9, 1, '#b7b2a2');
  P.text('NH', 1, 3, C.ink).text('66', 2, 10, C.ink);
  return P.c;
}

function chevron(right) {
  const P = new Pen(21, 28);
  P.r(9, 14, 3, 14, '#8a8f96').r(0, 0, 21, 15, C.ink).r(1, 1, 19, 13, C.yplate);
  for (const x0 of [2, 10]) for (let k = 0; k < 11; k++) {
    const step = k < 6 ? k : 10 - k;
    P.r(x0 + (right ? step : 5 - step), 2 + k, 4, 1, C.ink);
  }
  return P.c;
}

const SIGN = {
  g: ['#1f6b45', '#f3f2ea', '#f3f2ea'],
  y: ['#f2c230', '#23232b', '#23232b'],
  w: ['#f6f0e4', '#842B22', '#842B22'],
};

function sign(label) {
  const [kind, text] = label.split('|'), lines = text.split('/');
  const [bg, fg, edge] = SIGN[kind] || SIGN.y;
  const w = Math.max(...lines.map(l => textWidth(l))) + 10, h = lines.length * 7 + 6;
  const P = new Pen(w, h + 16);
  P.r(4, h - 1, 2, 17, '#7a7f86').r(w - 6, h - 1, 2, 17, '#7a7f86');
  P.r(0, 0, w, h, edge).r(1, 1, w - 2, h - 2, bg);
  lines.forEach((l, k) => P.text(l, Math.round(w / 2), 4 + k * 7, fg, 1, 'center'));
  return P.c;
}

function arch(label) {
  const P = new Pen(165, 66);
  P.s(5, 6, 4, 60, '#c9b27a').s(5, 6, 1, 60, '#e8d7a6').s(3, 62, 8, 4, '#7a6a48');
  P.r(4, 2, 157, 20, '#611E17').r(5, 3, 155, 18, '#842B22');
  P.text(label, 82, 7, '#F6F0E4', 2, 'center');
  for (let x = 6, k = 0; x < 158; x += 8, k++) {
    const col = k % 2 ? '#F6F0E4' : '#f2c230';
    P.r(x, 22, 7, 1, col).r(x + 1, 23, 5, 1, col).r(x + 2, 24, 3, 1, col).p(x + 3, 25, col);
  }
  if (label !== 'SUNDAY RIDE') for (let x = 5; x < 160; x += 5) P.r(x, 3, 5, 2, (x / 5 | 0) % 2 ? '#F6F0E4' : '#23232b').r(x, 19, 5, 2, (x / 5 | 0) % 2 ? '#23232b' : '#F6F0E4');
  return P.c;
}

function stall() {
  const P = new Pen(88, 58);
  P.r(10, 22, 64, 28, '#7a5234');
  for (let x = 14; x < 74; x += 7) P.r(x, 22, 1, 28, '#5e3d26');
  P.r(12, 23, 60, 13, '#3d281b');
  P.r(4, 9, 80, 11, '#2f6fb0').r(8, 6, 72, 3, '#2f6fb0').r(4, 19, 80, 2, '#1f4f82');
  for (let x = 10; x < 80; x += 12) P.r(x, 8, 5, 1, '#6aa2dc').r(x + 2, 12, 6, 1, '#6aa2dc');
  P.r(8, 20, 2, 38, '#c9b27a').r(76, 20, 2, 38, '#c9b27a');
  P.r(28, 0, 30, 9, '#F6F0E4').r(28, 0, 30, 1, '#842B22').r(28, 8, 30, 1, '#842B22').text('CHAI', 43, 2, '#842B22', 1, 'center');
  P.disc(34, 27, 3, C.skin).r(30, 30, 9, 8, '#f1efe6').r(32, 24, 5, 2, C.ink);
  P.r(11, 36, 62, 3, '#c9a56a').r(12, 39, 60, 12, '#8a5c38').r(12, 39, 60, 1, '#5e3d26');
  for (const [x, c] of [[16, '#e8d28a'], [22, '#c9302a'], [54, '#e8d28a']]) P.r(x, 30, 5, 6, C.glass).r(x, 29, 5, 2, c);
  P.r(44, 29, 8, 7, '#b9c2cc').r(52, 31, 3, 2, '#b9c2cc').r(46, 27, 4, 2, '#77818e');
  P.p(47, 24, '#f3f6f9').p(49, 22, '#f3f6f9').p(48, 20, '#f3f6f9').p(50, 18, '#f3f6f9');
  P.r(62, 22, 6, 9, '#e2b41f').r(63, 23, 1, 7, '#b88a10').r(66, 23, 1, 7, '#b88a10');
  P.r(58, 50, 26, 2, '#8a5c38').r(60, 52, 2, 6, '#5e3d26').r(80, 52, 2, 6, '#5e3d26');
  return P.c;
}

function bench() {
  const P = new Pen(31, 15);
  P.r(0, 0, 31, 3, '#8a5c38').r(0, 6, 31, 3, '#a8744a').r(2, 3, 2, 12, '#5e3d26').r(27, 3, 2, 12, '#5e3d26');
  return P.c;
}

function pole() {
  const P = new Pen(21, 100);
  P.r(9, 4, 3, 96, '#9a9a94').r(9, 4, 1, 96, '#c2c2ba').r(1, 9, 19, 2, '#8a8a84').r(4, 16, 13, 2, '#8a8a84');
  P.s(2, 6, 2, 3, '#e8e2d2').s(5, 13, 2, 3, '#e8e2d2');
  return P.c;
}

function fall(frame) {
  const P = new Pen(33, 50);
  P.r(4, 0, 25, 50, '#4d3a33').r(2, 6, 29, 40, '#4d3a33').dither(2, 0, 29, 50, '#3a2b26');
  for (let x = 9; x < 24; x++) {
    for (let y = 0; y < 46; y++) {
      const k = (x * 5 + y + frame * 3) % 7;
      if (k < 4) P.p(x, y, k < 2 ? '#f4fbff' : '#b9dcf0');
    }
  }
  P.disc(10, 45, 4, '#f4fbff').disc(17, 46, 4, '#e2f1fa').disc(24, 45, 4, '#f4fbff').dither(4, 42, 26, 8, '#b9dcf0', frame);
  return P.c;
}

function cloud(w, h) {
  const P = new Pen(w, h);
  const n = Math.max(3, Math.round(w / 9));
  for (let k = 0; k < n; k++) {
    const t = k / (n - 1), r = Math.round((h / 2 - 1) * (0.55 + 0.45 * Math.sin(Math.PI * t)));
    P.disc(Math.round(r + t * (w - 2 * r - 1)), h - 2 - r, r, '#ffffff');
  }
  P.r(2, h - 3, w - 4, 2, '#ffffff');
  return P.c;
}

function wisp() {
  const P = new Pen(120, 22);
  P.ell(60, 11, 58, 9, '#ffffff');
  const g = P.g;
  for (let y = 0; y < 22; y++) for (let x = 0; x < 120; x++) if ((x + y) & 1 || Math.abs(y - 11) > 6 && (x & 3)) g.clearRect(x, y, 1, 1);
  return P.c;
}

export function buildArt() {
  const signs = new Map(), arches = new Map();
  const set = (fn, n = 4) => Array.from({ length: n }, (_, v) => fn(v));
  const riderFrames = (k, o) => [0, 1].map(tread => leanSet(drawRider(k, { ...o, tread })));
  const art = {
    riderW: RW,
    player: null,
    // The player's four characters go on the back of their bike.
    setPlate(text) { art.plate = text; art.player = { ride: riderFrames(YOU, { plate: text }), brake: riderFrames(YOU, { plate: text, brake: true }) }; },
    shri: leanSet(drawRider(SHRI, { plate: 'SHRI' })),
    rivals: RIVALS.map((k, n) => leanSet(drawRider(k, { plate: ['ANU', 'DEV', 'MIA', 'KAI', 'ZOE', 'SAM'][n] }))),
    veh: {
      lorry: { rear: set(v => lorry(false, v)), front: set(v => lorry(true, v)) },
      bus: { rear: set(v => bus(false, v)), front: set(v => bus(true, v)) },
      auto: { rear: [auto(false)], front: [auto(true)] },
      car: { rear: set(v => hatch(false, v)), front: set(v => hatch(true, v)) },
      scooter: { rear: set(scooter), front: set(scooter) },
      cow: { rear: set(cow), front: set(cow) },
    },
    scenery: {
      palm: palm(), tree: tree(), bush: bush(), grass: grass(), rock: rock(), stone: stone(),
      chevL: chevron(false), chevR: chevron(true), stall: stall(), bench: bench(), pole: pole(),
    },
    fall: [fall(0), fall(1), fall(2)],
    clouds: [cloud(46, 14), cloud(30, 10), cloud(60, 16), cloud(22, 8)],
    wisp: wisp(),
    sign(label) { if (!signs.has(label)) signs.set(label, sign(label)); return signs.get(label); },
    arch(label) { if (!arches.has(label)) arches.set(label, arch(label)); return arches.get(label); },
  };
  art.setPlate('');
  return art;
}

// A labelled sheet of everything, for checking the art by eye (ride.html?shot=sprites).
export function drawSheet(target, art) {
  const items = [];
  art.player.ride[0].forEach((c, k) => items.push([`you ${k}`, c]));
  items.push(['you brake', art.player.brake[0][2]]);
  art.shri.forEach((c, k) => { if (k !== 1 && k !== 3) items.push([`shri ${k}`, c]); });
  art.rivals.forEach((f, k) => items.push([`rival ${k}`, f[2]]));
  for (const [name, v] of Object.entries(art.veh)) { items.push([`${name} rear`, v.rear[0]]); if (name !== 'scooter' && name !== 'cow') items.push([`${name} front`, v.front[0]]); if (v.rear[1]) items.push([`${name} 2`, v.rear[1]]); }
  items.push(['cow 3', art.veh.cow.rear[2]]);
  for (const [name, c] of Object.entries(art.scenery)) items.push([name, c]);
  items.push(['fall', art.fall[0]], ['sign', art.sign('y|SHARP/CURVES')], ['sign', art.sign('w|SHRI/WAS HERE')], ['sign', art.sign('g|VIEW POINT/1 KM')]);
  items.push(['arch', art.arch('SUNDAY RIDE')], ['arch', art.arch('VIEW POINT')], ['cloud', art.clouds[0]], ['wisp', art.wisp]);
  const Z = 3, g = target.getContext('2d');
  target.width = 1260; target.height = 1500;
  g.imageSmoothingEnabled = false;
  g.fillStyle = '#6f8f6a'; g.fillRect(0, 0, target.width, target.height);
  let x = 10, y = 10, rowH = 0;
  for (const [name, c] of items) {
    if (x + c.width * Z + 10 > target.width) { x = 10; y += rowH + 24; rowH = 0; }
    g.drawImage(c, x, y, c.width * Z, c.height * Z);
    drawText(g, name, x, y + c.height * Z + 4, '#17110f', 2);
    x += Math.max(c.width * Z, textWidth(name, 2)) + 16;
    rowH = Math.max(rowH, c.height * Z);
  }
}
