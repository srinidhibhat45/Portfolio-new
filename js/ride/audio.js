// Sunday Ride: sound, all synthesised with WebAudio. Nothing plays until the first tap or key press.
//
// The engine is a long-stroke single: it is built from separate combustion pulses, not a held note.
// One short "thump" is rendered once, then copies are scheduled on the audio clock at the firing rate
// (a four-stroke single fires once every two turns: rpm / 120 times a second). At idle the beats stand
// apart; as the revs climb they run together into a low burble. Five gears keep the revs rising and falling.

const KEY = 'portfolio-ride-muted';
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

export const IDLE = 1000, SHIFT_UP = 4500, SHIFT_DOWN = 1900, PEAK = 5200;
export const GEAR_TOP = [32, 55, 78, 100, 125];   // km/h reached at PEAK rpm in each of the five gears
export const firingRate = rpm => rpm / 120;

export function createGearbox() { return { gear: 0, rpm: IDLE }; }

// Step the gearbox: pick the gear, then move the revs towards what that gear gives at this road speed.
export function revs(box, kmh, gas, dt) {
  let want = PEAK * kmh / GEAR_TOP[box.gear];
  if (gas && want > SHIFT_UP && box.gear < GEAR_TOP.length - 1) box.gear++;
  else if (want < SHIFT_DOWN && box.gear > 0) box.gear--;
  want = PEAK * kmh / GEAR_TOP[box.gear];
  want = Math.max(IDLE + (gas && box.gear === 0 ? 650 : 0), want);     // clutch slip pulling away
  const rate = want > box.rpm ? 7000 : 16000;                            // revs fall quickly on a shift
  box.rpm += clamp(want - box.rpm, -rate * dt, rate * dt);
  return box.rpm;
}

// One combustion pulse, about 180 ms: a sine that drops from about 110 Hz to 45 Hz as it dies away,
// a little second and third harmonic so small speakers can find it, and a pat of low-passed noise for the exhaust.
export function makeThump(ctx) {
  const sr = ctx.sampleRate, dur = 0.18, n = Math.floor(sr * dur);
  const buf = ctx.createBuffer(1, n, sr), d = buf.getChannelData(0);
  let ph = 0, lp = 0, seed = 20261112;
  const noise = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2147483648) - 1;
  const a = 1 - Math.exp(-2 * Math.PI * 700 / sr);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    ph += 2 * Math.PI * (45 + 65 * Math.exp(-t * 26)) / sr;
    const body = Math.sin(ph) * Math.exp(-t * 17) + 0.5 * Math.sin(2 * ph) * Math.exp(-t * 28) + 0.2 * Math.sin(3 * ph) * Math.exp(-t * 40);
    lp += (noise() - lp) * a;
    const pat = lp * 2.8 * Math.exp(-t * 55);
    d[i] = (body + pat) * Math.min(1, t / 0.002) * Math.min(1, (dur - t) / 0.02) * 0.8;
  }
  return buf;
}

// The tone shaping every engine voice runs through: a soft resonance near 120 Hz, a low-pass around 1 kHz,
// then a gentle limiter so the beats do not clip when they pile up at high revs.
function engineChain(ctx, out) {
  const body = ctx.createBiquadFilter(), lid = ctx.createBiquadFilter(), limit = ctx.createDynamicsCompressor();
  body.type = 'peaking'; body.frequency.value = 120; body.Q.value = 1.1; body.gain.value = 6;
  lid.type = 'lowpass'; lid.frequency.value = 900; lid.Q.value = 0.7;
  limit.threshold.value = -10; limit.knee.value = 8; limit.ratio.value = 6; limit.attack.value = 0.004; limit.release.value = 0.12;
  body.connect(lid); lid.connect(limit); limit.connect(out);
  return { input: body, lid };
}

// One engine. schedule() queues every pulse that is due before `until` on the context's clock.
function createVoice(ctx, chain, thump, pitch = 1) {
  const bus = ctx.createGain();
  bus.gain.value = 0;
  bus.connect(chain.input);
  let next = 0;
  const fire = (at, rate, level) => {
    const src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = thump; src.playbackRate.value = rate; g.gain.value = level;
    src.connect(g); g.connect(bus);
    src.start(at);
  };
  return {
    bus,
    schedule(until, rpm, throttle, rnd = Math.random) {
      if (next < ctx.currentTime) next = ctx.currentTime + 0.01;
      const rate = firingRate(rpm), period = 1 / rate;
      const lumpy = clamp(1 - (rpm - IDLE) / 1500, 0, 1);            // uneven at idle, even once it is pulling
      const hard = clamp((rpm - IDLE) / (PEAK - IDLE), 0, 1);
      while (next < until) {
        const level = (0.5 + 0.5 * throttle) * (0.3 + 0.7 * Math.sqrt(firingRate(IDLE) / rate)) * (1 + (rnd() - 0.5) * (0.1 + 0.3 * lumpy));
        fire(next, pitch * (0.92 + 0.5 * hard) * (1 + (rnd() - 0.5) * 0.04), level);
        // on a closed throttle at speed, a light pop now and then between beats
        if (throttle < 0.2 && rpm > 2600 && rnd() < 0.18) fire(next + period * 0.5, pitch * 0.8, level * 0.35);
        next += period * (1 + (rnd() - 0.5) * (0.03 + 0.12 * lumpy));
      }
    },
  };
}

export function createAudio() {
  let ctx = null, master = null, chain = null, mine = null, his = null, timer = 0, muted = false;
  const me = { box: createGearbox(), throttle: 0, on: false };
  const shri = { box: createGearbox(), near: 0 };
  try { muted = localStorage.getItem(KEY) === '1'; } catch { /* private window */ }

  function pump() {
    if (!ctx || ctx.state !== 'running') return;
    const until = ctx.currentTime + 0.12;
    if (me.on) mine.schedule(until, me.box.rpm, me.throttle);
    if (shri.near > 0.02) his.schedule(until, shri.box.rpm, 0.7);
  }

  function start() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume().catch(() => {}); return true; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try { ctx = new AC(); } catch { ctx = null; return false; }
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.6;
    master.connect(ctx.destination);
    const engines = ctx.createGain();
    engines.gain.value = 0.85;
    engines.connect(master);
    chain = engineChain(ctx, engines);
    const thump = makeThump(ctx);
    mine = createVoice(ctx, chain, thump, 1);
    his = createVoice(ctx, chain, thump, 0.94);
    timer = setInterval(pump, 25);
    return true;
  }

  function tone(freq, dur, type = 'square', vol = 0.18, slide = 0, delay = 0) {
    if (!ctx || muted) return;
    const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.linearRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.setValueAtTime(vol, t + Math.max(0.012, dur - 0.05));
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function noise(dur, vol, from, to) {
    if (!ctx || muted) return;
    const n = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, n, ctx.sampleRate), data = buf.getChannelData(0);
    for (let k = 0; k < n; k++) data[k] = (Math.random() * 2 - 1) * (1 - k / n);
    const src = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), g = ctx.createGain(), t = ctx.currentTime;
    src.buffer = buf; lp.type = 'lowpass';
    lp.frequency.setValueAtTime(from, t); lp.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.value = vol;
    src.connect(lp); lp.connect(g); g.connect(master);
    src.start(t);
  }

  return {
    start,
    // speed is a fraction of top speed; called once a frame.
    setEngine(speed, gas, running, dt = 1 / 60) {
      revs(me.box, running ? speed * 120 : 0, gas && running, dt);
      me.throttle += ((gas ? 1 : 0) - me.throttle) * Math.min(1, dt * 10);
      me.on = running;
      if (!ctx) return;
      const t = ctx.currentTime;
      mine.bus.gain.setTargetAtTime(running ? 0.9 : 0, t, 0.06);
      chain.lid.frequency.setTargetAtTime(850 + 450 * me.throttle, t, 0.08);
    },
    // Shri's bike, heard faintly when he is close. near runs from 0 (out of earshot) to 1 (alongside).
    setShri(speed, near, dt = 1 / 60) {
      revs(shri.box, speed * 120, true, dt);
      shri.near = near;
      if (ctx) his.bus.gain.setTargetAtTime(0.32 * near, ctx.currentTime, 0.1);
    },
    get rpm() { return me.box.rpm; },
    get gear() { return me.box.gear; },
    get state() { return ctx ? ctx.state : 'none'; },
    get gear() { return me.box.gear + 1; },
    get muted() { return muted; },
    setMuted(m) {
      muted = !!m;
      try { localStorage.setItem(KEY, muted ? '1' : '0'); } catch { /* ignore */ }
      if (master) master.gain.setTargetAtTime(muted ? 0 : 0.6, ctx.currentTime, 0.02);
    },
    pause() { if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {}); },
    resume() { if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {}); },
    stop() { clearInterval(timer); },
    horn() { tone(392, 0.2, 'square', 0.13); tone(494, 0.2, 'square', 0.11); },
    beep(high) { tone(high ? 880 : 440, high ? 0.3 : 0.12, 'square', 0.14); },
    bump() { tone(95, 0.14, 'sine', 0.5, -45); noise(0.08, 0.2, 900, 200); },
    scrape() { noise(0.16, 0.14, 2400, 700); },
    spill() { noise(0.55, 0.3, 1400, 160); tone(180, 0.35, 'triangle', 0.2, -110); },
    moo() { tone(170, 0.55, 'triangle', 0.16, -60); },
    up() { tone(660, 0.07, 'square', 0.1); tone(880, 0.09, 'square', 0.1, 0, 0.07); },
    down() { tone(440, 0.09, 'square', 0.1); tone(330, 0.12, 'square', 0.1, 0, 0.08); },
    finish() { [523, 659, 784, 1047].forEach((f, k) => tone(f, 0.16, 'square', 0.13, 0, k * 0.13)); tone(1319, 0.4, 'triangle', 0.14, 0, 0.52); },
  };
}

// For checking the engine without ears: render it offline at a fixed rpm and measure what came out.
// Returns the spacing of the beats, how far the sound drops between them, and where its energy sits.
export async function auditEngine(rpm, throttle = 1, seconds = 2) {
  const sr = 48000, ctx = new OfflineAudioContext(1, sr * seconds, sr);
  const chain = engineChain(ctx, ctx.destination);
  chain.lid.frequency.value = 850 + 450 * throttle;
  const voice = createVoice(ctx, chain, makeThump(ctx), 1);
  voice.bus.gain.value = 0.9;
  let seed = 7;
  const rnd = () => ((seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 4294967296);
  voice.schedule(seconds, rpm, throttle, rnd);
  const data = (await ctx.startRendering()).getChannelData(0);

  // envelope, then the beats in it
  const win = Math.round(sr * 0.004), env = new Float32Array(data.length);
  let acc = 0;
  for (let i = 0; i < data.length; i++) { acc += Math.abs(data[i]); if (i >= win) acc -= Math.abs(data[i - win]); env[i] = acc / win; }
  let top = 0;
  for (let i = 0; i < env.length; i++) top = Math.max(top, env[i]);
  const gap = Math.round(sr * 0.45 * 120 / rpm), peaks = [];
  for (let i = gap; i < env.length - gap; i++) {
    if (env[i] < top * 0.3) continue;
    let best = true;
    for (let k = i - gap; k <= i + gap; k++) if (env[k] > env[i]) { best = false; break; }
    if (best) { peaks.push(i); i += gap; }
  }
  const steps = peaks.slice(1).map((p, k) => (p - peaks[k]) / sr);
  const mean = steps.reduce((a, b) => a + b, 0) / (steps.length || 1);
  const sd = Math.sqrt(steps.reduce((a, b) => a + (b - mean) ** 2, 0) / (steps.length || 1));
  let dip = 0;
  for (let k = 1; k < peaks.length; k++) { let low = 1e9; for (let i = peaks[k - 1]; i < peaks[k]; i++) low = Math.min(low, env[i]); dip += low / Math.max(env[peaks[k - 1]], env[peaks[k]]); }
  dip /= Math.max(1, peaks.length - 1);

  // spectrum: one 65536-point FFT from the middle of the take
  const N = 65536, re = new Float64Array(N), im = new Float64Array(N), from = Math.max(0, (data.length - N) >> 1);
  for (let i = 0; i < N; i++) re[i] = (data[from + i] || 0) * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / N));
  for (let i = 1, j = 0; i < N; i++) { let bit = N >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { const t = re[i]; re[i] = re[j]; re[j] = t; } }
  for (let len = 2; len <= N; len <<= 1) {
    const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < N; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2, xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr;
        re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
        const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
      }
    }
  }
  const bands = { under150: 0, to500: 0, to1000: 0, to4000: 0, over4000: 0 };
  let total = 0, centroid = 0;
  for (let k = 1; k < N / 2; k++) {
    const f = k * sr / N, e = re[k] * re[k] + im[k] * im[k];
    total += e; centroid += e * f;
    bands[f < 150 ? 'under150' : f < 500 ? 'to500' : f < 1000 ? 'to1000' : f < 4000 ? 'to4000' : 'over4000'] += e;
  }
  for (const k in bands) bands[k] = +(bands[k] / total).toFixed(4);
  let peakLevel = 0;
  for (let i = 0; i < data.length; i++) peakLevel = Math.max(peakLevel, Math.abs(data[i]));
  return { rpm, expectedPerSecond: +firingRate(rpm).toFixed(2), beats: peaks.length, perSecond: +(1 / mean).toFixed(2), spacingMs: +(mean * 1000).toFixed(1), jitterMs: +(sd * 1000).toFixed(1), dipBetweenBeats: +dip.toFixed(3), centroidHz: Math.round(centroid / total), bands, peakLevel: +peakLevel.toFixed(2) };
}
