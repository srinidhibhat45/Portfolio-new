// Sunday Ride: the page glue. Screens, input, the fixed-step loop and the debug flags.

import { createGame, resetGame, step, autopilot, shriLead, STEP, RIDERS, MAX_SPEED } from './sim.js?v=20261112-ride-3';
import { buildArt, drawSheet, drawPortrait } from './sprites.js?v=20261112-ride-3';
import { createRenderer, VIEW_W, formatTime, ordinal } from './render.js?v=20261112-ride-3';
import { createAudio, auditEngine } from './audio.js?v=20261112-ride-3';
import { drawText, textWidth } from './font.js?v=20261112-ride-3';
import { createBoard } from './board.js?v=20261112-ride-6';

const BEST = 'portfolio-ride-best', PLATE = 'portfolio-ride-plate';
// The plate is four characters, A to Z and 0 to 9. It is kept in this browser only.
const cleanPlate = v => String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
const q = new URLSearchParams(location.search);
const $ = id => document.getElementById(id);
const flag = name => q.get(name) === '1';
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Debug flags, all harmless: ?debug=1 shows errors on the page, ?shot=sprites draws the sprite sheet,
// ?autostart=1 skips the title, ?demo=1 lets the autopilot ride, ?t=40 jumps that many seconds into the ride,
// ?freeze=1 stops after the first frame, ?touch=1 shows the touch pad, ?screen=finish|pause opens that panel
// (?beat=1 with screen=finish shows the winning version), ?plate=ABCD fills in the number plate, ?screen=board opens the leaderboard.
if (flag('debug')) {
  const box = document.createElement('pre');
  box.className = 'ride-debug';
  document.body.append(box);
  const show = msg => { box.textContent += msg + '\n'; };
  window.addEventListener('error', e => show(`${e.message} (${(e.filename || '').split('/').pop()}:${e.lineno})`));
  window.addEventListener('unhandledrejection', e => show(String(e.reason)));
}

const canvas = $('rideCanvas');
const art = buildArt();

if (q.get('shot') === 'sprites') {
  document.body.classList.add('is-sheet');
  art.setPlate(cleanPlate(q.get('plate')) || 'ABCD');
  drawSheet(canvas, art);
} else {
  run();
}

function run() {
  const renderer = createRenderer(canvas, art);
  const audio = createAudio();
  const g = createGame();
  const main = $('rideMain'), pad = $('ridePad');
  const panels = { intro: $('rideIntro'), title: $('rideTitle'), paused: $('ridePaused'), finish: $('rideFinish'), board: $('rideBoard') };
  const live = $('rideLive'), muteBtn = $('rideMute'), pauseBtn = $('ridePause');
  const demo = flag('demo');
  const skip = Math.max(0, Math.min(600, parseFloat(q.get('t')) || 0));
  // Rides with a helping hand (the autopilot, a jump ahead, a skipped title) never go on the public board.
  const assisted = demo || skip > 0 || flag('autostart');
  let mode = 'title';            // title (the intro and the pre-race card) | ride | paused | finish
  let attract = true;            // the autopilot rides behind the title
  let acc = 0, lastNow = 0, shake = 0, finishAt = 0, stopped = false, hudTop = 0;

  // ---- the player's number plate -------------------------------------------
  const plateInput = $('ridePlate'), plateError = $('ridePlateError');
  let plate = cleanPlate(q.get('plate'));
  if (!plate) { try { plate = cleanPlate(localStorage.getItem(PLATE)); } catch { /* private window */ } }
  plateInput.value = plate;
  art.setPlate(plate);
  plateInput.addEventListener('input', () => {
    const v = cleanPlate(plateInput.value);
    if (v !== plateInput.value) plateInput.value = v;
    plate = v;
    art.setPlate(v);                       // it shows on the bike behind the title straight away
    plateError.hidden = true;
    plateInput.removeAttribute('aria-invalid');
  });
  function tryStart() {
    plate = cleanPlate(plateInput.value);
    if (plate === 'SHRI') {
      plateError.textContent = "That's Shri's plate. Pick your own 4 letters or numbers.";
      plateError.hidden = false;
      plateInput.setAttribute('aria-invalid', 'true');
      plateInput.focus();
      return;
    }
    if (plate.length !== 4) {
      plateError.textContent = plate.length ? `That is ${plate.length}. The plate needs exactly 4 letters or numbers.` : 'Type 4 letters or numbers for your plate first.';
      plateError.hidden = false;
      plateInput.setAttribute('aria-invalid', 'true');
      plateInput.focus();
      return;
    }
    try { localStorage.setItem(PLATE, plate); } catch { /* ignore */ }
    art.setPlate(plate);
    plateInput.blur();
    startRide();
  }
  $('rideForm').addEventListener('submit', e => { e.preventDefault(); tryStart(); });

  // ---- input -------------------------------------------------------------
  const keys = { left: false, right: false, gas: false, brake: false, horn: false };
  let hornTap = false;           // a quick tap of the horn still counts if it lands between two frames
  const KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'gas', KeyW: 'gas', ArrowDown: 'brake', KeyS: 'brake', Space: 'horn', KeyH: 'horn',
  };
  const typing = e => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
  window.addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey || typing(e)) return;
    const k = KEYMAP[e.code];
    if (k) {
      if (mode === 'ride') { keys[k] = true; if (k === 'horn') hornTap = true; e.preventDefault(); }
      else if (k === 'horn' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') e.preventDefault();
      return;
    }
    if (e.repeat) return;
    if (!panels.board.hidden) { if (e.code === 'Escape') board.close(); else if (e.code === 'KeyM') setMuted(!audio.muted); return; }
    if (e.code === 'KeyP' || e.code === 'Escape') { if (mode === 'ride') pause(); else if (mode === 'paused') resume(); }
    else if (e.code === 'KeyM') setMuted(!audio.muted);
    else if (e.code === 'Enter' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') {
      if (mode === 'title') { if (!panels.intro.hidden) show('title'); else tryStart(); } else if (mode === 'finish') startRide(); else if (mode === 'paused') resume();
    }
  });
  window.addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) { keys[k] = false; if (mode === 'ride') e.preventDefault(); } });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

  // Touch pad: every button tracks its own pointers, so two thumbs work together.
  for (const btn of pad.querySelectorAll('[data-key]')) {
    const k = btn.dataset.key, held = new Set();
    const sync = () => { keys[k] = held.size > 0; btn.classList.toggle('is-down', held.size > 0); };
    btn.addEventListener('pointerdown', e => { e.preventDefault(); audio.start(); held.add(e.pointerId); if (k === 'horn') hornTap = true; try { btn.setPointerCapture(e.pointerId); } catch { /* ignore */ } sync(); });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) btn.addEventListener(type, e => { held.delete(e.pointerId); sync(); });
    btn.addEventListener('contextmenu', e => e.preventDefault());
  }
  // No scroll, pinch or double-tap zoom while riding.
  main.addEventListener('touchmove', e => { if (mode === 'ride') e.preventDefault(); }, { passive: false });
  document.addEventListener('gesturestart', e => e.preventDefault());

  const coarse = window.matchMedia('(pointer: coarse)').matches;
  let touchUI = coarse || flag('touch');
  window.addEventListener('touchstart', () => { if (!touchUI) { touchUI = true; layout(); } }, { passive: true, once: true });

  // ---- layout ------------------------------------------------------------
  let seenW = 0, seenH = 0;
  function layout() {
    const vw = window.innerWidth, vh = window.innerHeight;
    seenW = vw; seenH = vh;
    const portrait = vh > vw * 1.15;
    const short = !portrait && vh < 520;
    document.body.classList.toggle('is-portrait', portrait);
    document.body.classList.toggle('is-short', short);
    document.body.classList.toggle('has-pad', touchUI || vw < 700);
    const h = portrait ? 260 : 200;
    if (renderer.height !== h) renderer.setSize(h);
    const bar = short ? 0 : document.querySelector('.ride-bar').offsetHeight;
    const frame = 16;
    const availW = vw - (portrait ? 0 : frame), availH = portrait ? vh * 0.5 : vh - bar - (short ? 0 : frame);
    let scale = Math.min(availW / VIEW_W, availH / h);
    if (scale >= 2) scale = Math.floor(scale * 2) / 2 >= 3 ? Math.floor(scale) : Math.floor(scale * 2) / 2;
    scale = Math.max(0.5, scale);
    // On a phone held sideways the corner buttons can sit over the picture: drop the HUD's corners below them.
    hudTop = short && (vw - VIEW_W * scale) / 2 < 110 ? Math.ceil(50 / scale) : 0;
    canvas.style.width = Math.round(VIEW_W * scale) + 'px';
    canvas.style.height = Math.round(h * scale) + 'px';
    document.documentElement.style.setProperty('--stage-h', Math.round(h * scale) + 'px');
  }
  window.addEventListener('resize', layout);
  window.addEventListener('orientationchange', layout);
  layout();

  // ---- screens -----------------------------------------------------------
  function show(name) {
    for (const [k, el] of Object.entries(panels)) el.hidden = k !== name;
    pad.hidden = !!name;
    pauseBtn.hidden = mode !== 'ride' && mode !== 'paused';
    document.body.dataset.mode = mode;
    if (name) {
      // On the title, a keyboard user with no plate yet starts in the plate box; a phone never gets its keyboard thrown open.
      // Every panel opens at its top. On a touch screen nothing is focused for you: some phone browsers scroll a
      // focused button into view anyway, which used to open the intro halfway down, with its picture cut off.
      panels[name].scrollTop = 0;
      const first = name === 'title' && plate.length !== 4 && !coarse ? plateInput : panels[name].querySelector('[data-first]');
      if (first && !coarse && !flag('freeze')) first.focus({ preventScroll: true });
    }
    else canvas.focus({ preventScroll: true });   // so Space is the horn, not a press of whichever button had focus
  }

  function readBest() { try { const v = parseFloat(localStorage.getItem(BEST)); return Number.isFinite(v) && v > 0 ? v : 0; } catch { return 0; } }
  function showBest() { const b = readBest(); $('rideBest').textContent = b ? `Your best ${formatTime(b)}` : 'No ride finished yet'; }

  function startRide() {
    audio.start(); audio.resume();
    resetGame(g);
    renderer.clear();
    attract = false; mode = 'ride'; acc = 0; shake = 0; finishAt = 0;
    for (const k in keys) keys[k] = false;
    board.startRun(!assisted);
    audio.beep(false);
    show(null);
    renderer.say('CATCH SHRI', 2.6, 2, 0.2);
    live.textContent = 'Ride started. Shri is ahead on the blue bike.';
  }

  function pause() {
    if (mode !== 'ride') return;
    mode = 'paused'; audio.pause();
    show('paused');
  }
  function resume() {
    if (mode !== 'paused') return;
    mode = 'ride'; acc = 0; audio.resume();
    for (const k in keys) keys[k] = false;
    show(null);
  }

  function finish() {
    mode = 'finish';
    const { time, place, beat, margin } = g.finish;
    const by = margin.toFixed(1);
    const result = beat ? `${plate} beat Shri by ${by}\u00a0s` : `Shri got there first, by ${by}\u00a0s. He knows these roads.`;
    $('rideFinishTitle').textContent = result;
    // The debug finish screen (?screen=finish) shows a made-up result: it never becomes your best.
    const best = readBest(), fresh = !best || time < best, real = q.get('screen') !== 'finish' && !assisted;
    if (fresh && real) { try { localStorage.setItem(BEST, time.toFixed(2)); } catch { /* ignore */ } }
    $('ridePlace').textContent = `${ordinal(place).toLowerCase()} of ${RIDERS}`;
    $('rideTime').textContent = formatTime(time);
    $('rideRecord').textContent = fresh ? (best ? 'New best run.' : 'Your first finish.') : `Your best ${formatTime(best)}`;
    $('rideVerdict').textContent = beat ? 'The chai at the viewpoint is on him.' : margin < 4 ? 'That was close. Brake early for the hairpins and go again.' : 'Honk at the lorries, brake early for the hairpins, and go again.';
    const canPost = board.finishRun(time, plate, { assisted });
    show('finish');
    if (canPost && !coarse && !flag('freeze')) board.focusName();
    live.textContent = `${result} You finished ${ordinal(place).toLowerCase()} of ${RIDERS} in ${formatTime(time)}.`;
    showBest();
  }

  function setMuted(m) {
    audio.setMuted(m);
    muteBtn.setAttribute('aria-pressed', String(audio.muted));
    muteBtn.setAttribute('aria-label', audio.muted ? 'Turn sound on' : 'Mute sound');
    muteBtn.classList.toggle('is-off', audio.muted);
  }

  $('rideAgain').addEventListener('click', startRide);
  const board = createBoard({ $, onRide: startRide, onBack: { show } });
  for (const b of document.querySelectorAll('[data-board]')) b.addEventListener('click', () => board.open(mode === 'finish' ? 'finish' : 'title'));
  $('rideResume').addEventListener('click', resume);
  $('rideRestart').addEventListener('click', startRide);
  pauseBtn.addEventListener('click', () => (mode === 'paused' ? resume() : pause()));
  muteBtn.addEventListener('click', () => { audio.start(); setMuted(!audio.muted); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { if (mode === 'ride') pause(); else audio.pause(); } else if (mode !== 'paused') audio.resume(); });
  setMuted(audio.muted);
  showBest();

  // The title wordmark, set in the game's own pixel font.
  const logo = $('rideLogo'), lg = logo.getContext('2d');
  logo.width = textWidth('SUNDAY RIDE') + 2; logo.height = 7;
  drawText(lg, 'SUNDAY RIDE', 2, 2, '#611E17'); drawText(lg, 'SUNDAY RIDE', 1, 1, '#F6F0E4');

  // ---- events from the simulation -----------------------------------------
  function hear(e) {
    if (attract) return;
    switch (e.type) {
      case 'count': audio.beep(false); break;
      case 'go': audio.beep(true); renderer.say('GO!', 0.9, 5, 0.28); break;
      case 'horn': audio.horn(); break;
      case 'moo': audio.moo(); renderer.note('MOO', 1.2); break;
      case 'bump': audio.bump(); shake = Math.max(shake, 0.18); break;
      case 'scrape': audio.scrape(); shake = Math.max(shake, 0.1); break;
      case 'spill': audio.spill(); shake = 0.45; renderer.say('OOPS!', 1.2, 4, 0.3); break;
      case 'place': if (e.up && g.t > 2) { audio.up(); renderer.note(`UP TO ${ordinal(e.place)}`, 1.3); } break;
      case 'shri': if (g.t > 2) { if (e.ahead) { audio.down(); renderer.note('SHRI IS THROUGH', 1.6); } else { audio.up(); renderer.note('PAST SHRI', 1.6); } } break;
      case 'stage': renderer.say(e.name, 2.4, 2, 0.24); break;
      case 'finish': audio.finish(); renderer.say('VIEW POINT!', 2.2, 3, 0.26); finishAt = performance.now() + 2300; break;
      default: break;
    }
  }

  // ---- loop --------------------------------------------------------------
  function advance(dt) {
    acc += dt;
    let n = 0;
    while (acc >= STEP && n < 6) {
      if (attract || demo) step(g, autopilot(g));
      else { step(g, hornTap ? { ...keys, horn: true } : keys); hornTap = false; }
      acc -= STEP; n++;
      if (g.events.length) for (const e of g.events.splice(0)) hear(e);
    }
    if (n === 6) acc = 0;
    if (attract && (g.phase === 'done' && g.player.speed < 50)) { resetGame(g); g.phase = 'ride'; }
  }

  function frame(now) {
    const dt = Math.min(0.1, (now - lastNow) / 1000 || 0);
    lastNow = now;
    if (window.innerWidth !== seenW || window.innerHeight !== seenH) layout();   // some browsers resize without saying so
    const live2 = mode !== 'paused';
    if (live2) advance(dt);
    if (mode === 'ride' && finishAt && now >= finishAt) finish();
    renderer.draw(g, { dt: live2 ? dt : 0, hud: !attract, reduced, hudTop, rpm: audio.rpm, gear: audio.gear });
    if (shake > 0) {
      shake -= dt;
      const k = reduced || shake <= 0 ? 0 : 3;
      canvas.style.transform = k ? `translate(${Math.round((Math.random() - 0.5) * k * 2)}px, ${Math.round((Math.random() - 0.5) * k * 2)}px)` : '';
    }
    const p = g.player, riding = mode === 'ride';
    audio.setEngine(p.speed / MAX_SPEED, p.gas, riding, dt);
    audio.setShri(g.shri.speed / MAX_SPEED, riding ? Math.max(0, 1 - Math.abs(shriLead(g)) / 70) : 0, dt);
    if (!stopped) requestAnimationFrame(frame);
  }

  if (flag('debug')) window.__ride = { g, keys, audio, auditEngine, get mode() { return mode; }, get plate() { return plate; } };

  // ---- start-up, with the debug flags --------------------------------------
  g.phase = 'ride';                       // attract mode has no countdown
  // The intro picture: Shri and Sky, drawn in the game's own pixels.
  const portrait = drawPortrait(), pc = $('ridePortrait');
  pc.width = portrait.width; pc.height = portrait.height; pc.getContext('2d').drawImage(portrait, 0, 0);
  $('rideNext').addEventListener('click', () => show('title'));
  $('rideBackToIntro').addEventListener('click', () => show('intro'));
  show(flag('autostart') || q.get('screen') || q.get('intro') === '0' ? 'title' : 'intro');
  if (flag('autostart')) { if (plate.length !== 4) { plate = 'RIDR'; art.setPlate(plate); } startRide(); }
  if (skip) {
    const drive = attract || demo || true;
    for (let k = 0; k < skip * 60; k++) { step(g, drive ? autopilot(g) : keys); g.events.length = 0; }
    if (g.phase === 'done' && !attract) finishAt = 1;
  }
  if (q.get('screen') === 'pause' && mode === 'ride') pause();
  if (q.get('screen') === 'finish') {
    if (plate.length !== 4) plate = 'RIDR';
    if (!g.finish) g.finish = flag('beat') ? { time: 166.2, place: 1, beat: true, margin: 2.4 } : { time: 172.4, place: 2, beat: false, margin: 3.1 };
    mode = 'ride'; attract = false; finish();
  }
  if (q.get('screen') === 'board') board.open('title');
  if (flag('freeze')) stopped = true;
  requestAnimationFrame(frame);
}
