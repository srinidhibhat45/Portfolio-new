/* The hero's strip of covers drifts on its own and can be dragged or flicked either way. */
(function () {
  'use strict';
  var ribbon = document.querySelector('.hero-ribbon');
  var track = ribbon && ribbon.querySelector('.hero-ribbon-track');
  if (!track) return;
  var preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  var LOOP_SECONDS = 80;
  var DRAG_START = 6;   // px a pointer must travel sideways before a press becomes a drag
  // press: the pointer is down (the strip holds still, so the cover under it stays put for a click).
  // drag: that press has moved far enough to move the strip; the click that follows it is swallowed.
  var half = 0, offset = 0, velocity = 0, press = null, drag = null, swallow = false, last = 0, frame = 0, visible = true;

  // Script takes over from the CSS animation, which stays as the fallback without it.
  ribbon.classList.add('is-live');

  // The strip moves, so lazy loading can leave blank cards drifting in. Once the page has
  // loaded, fetch every cover; the second set repeats the first, so it costs nothing more.
  function loadAll() { track.querySelectorAll('img').forEach(function (img) { img.loading = 'eager'; }); }
  if (document.readyState === 'complete') loadAll(); else window.addEventListener('load', loadAll, {once: true});

  // The track holds the set of covers twice, so half its width is one full loop.
  function measure() { half = track.scrollWidth / 2; }
  function drift() { return preference.matches ? 0 : -half / LOOP_SECONDS; }
  function paint() {
    if (half) offset = ((offset % half) - half) % half;
    track.style.transform = 'translate3d(' + offset.toFixed(1) + 'px,0,0)';
  }
  function tick(now) {
    frame = 0;
    var seconds = Math.min((now - last) / 1000, .05);
    last = now;
    if (!drag && !press) {
      // After a flick, the speed eases back to the steady drift.
      velocity += (drift() - velocity) * Math.min(1, seconds * 3.5);
      offset += velocity * seconds;
      paint();
      if (preference.matches && Math.abs(velocity) < 2) { velocity = 0; return; }
    }
    if (visible && !document.hidden) frame = requestAnimationFrame(tick);
  }
  function run() {
    if (frame || !visible || document.hidden) return;
    last = performance.now();
    frame = requestAnimationFrame(tick);
  }

  // A press catches the strip. It only becomes a drag, and only then takes the pointer, once it has
  // moved a few pixels sideways; a press that stays put is a click and opens the cover's case study.
  ribbon.addEventListener('pointerdown', function (event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    press = {id: event.pointerId, x: event.clientX, y: event.clientY};
    swallow = false;
    velocity = 0;
  });
  ribbon.addEventListener('pointermove', function (event) {
    if (press && !drag && event.pointerId === press.id) {
      var dx = event.clientX - press.x, dy = event.clientY - press.y;
      if (Math.abs(dx) < DRAG_START || Math.abs(dx) < Math.abs(dy)) return;
      drag = {id: event.pointerId, x: event.clientX, offset: offset, lastX: event.clientX, lastTime: performance.now()};
      try { ribbon.setPointerCapture(event.pointerId); } catch (err) { /* pointer already gone */ }
      ribbon.classList.add('is-dragging');
      return;
    }
    if (!drag || event.pointerId !== drag.id) return;
    var now = performance.now(), elapsed = Math.max(1, now - drag.lastTime);
    velocity = velocity * .6 + (event.clientX - drag.lastX) / elapsed * 1000 * .4;
    offset = drag.offset + event.clientX - drag.x;
    drag.lastX = event.clientX;
    drag.lastTime = now;
    paint();
  });
  function release(event) {
    if (!press || event.pointerId !== press.id) return;
    press = null;
    if (drag) {
      // A pause before letting go means a placed drag, not a flick.
      var flick = performance.now() - drag.lastTime < 80;
      drag = null;
      ribbon.classList.remove('is-dragging');
      velocity = flick ? Math.max(-1400, Math.min(1400, velocity)) : 0;
      swallow = event.type === 'pointerup';
    }
    run();
  }
  ribbon.addEventListener('pointerup', release);
  ribbon.addEventListener('pointercancel', release);
  // A mouse that leaves before it ever dragged lets the strip drift on.
  ribbon.addEventListener('pointerleave', function (event) {
    if (press && !drag && event.pointerId === press.id) { press = null; run(); }
  });
  // The click that ends a drag must not open a case study. Caught on the way down, before the cover's own handler.
  ribbon.addEventListener('click', function (event) {
    if (!swallow) return;
    swallow = false;
    event.preventDefault();
    event.stopPropagation();
  }, true);
  ribbon.addEventListener('dragstart', function (event) { event.preventDefault(); });

  new ResizeObserver(function () { measure(); paint(); }).observe(track);
  new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; run(); }).observe(ribbon);
  document.addEventListener('visibilitychange', run);
  preference.addEventListener('change', run);

  measure();
  velocity = drift();
  paint();
  run();
})();
