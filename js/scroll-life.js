/* Scroll life: the page arrives as you scroll. Each kind of thing has its own small entrance:
   chapter borders unroll like cloth, chapter numbers pop on like stickers, headings rise out of a mask,
   cards settle in a stagger, the figures count up, and each chapter's art lands in its own way
   (the peacock perches, the kalash is etched, the pond fills, the cloth is laid down).

   Safe by design: nothing is hidden until this script runs; content already scrolled past is never hidden;
   reduced motion, access mode, printing and keyboard focus all show everything at once. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches || root.getAttribute('data-access') === 'on' || /[?&]static\b/.test(location.search) ||
      !('IntersectionObserver' in window) || !Element.prototype.animate) return;

  var phone = window.matchMedia('(max-width: 600px)').matches;
  var SOFT = 'cubic-bezier(.16, 1, .3, 1)';        // long, calm settle
  var SPRING = 'cubic-bezier(.34, 1.56, .64, 1)';  // a small overshoot, for the playful bits
  var d = function (px) { return Math.round(phone ? px * .6 : px) + 'px'; };

  // Each entrance: keyframes, duration and easing. Individual transform properties (translate, scale,
  // rotate) are used so they add to any transform an element already has (hover lifts, marquees).
  var KINDS = {
    rise:    { k: function () { return [{ opacity: 0, translate: '0 ' + d(26), clipPath: 'inset(0 0 100% 0)' }, { opacity: 1, translate: '0 0', clipPath: 'inset(0 0 -20% 0)' }]; }, t: 900, e: SOFT },
    fade:    { k: function () { return [{ opacity: 0, translate: '0 ' + d(12) }, { opacity: 1, translate: '0 0' }]; }, t: 800, e: SOFT },
    card:    { k: function () { return [{ opacity: 0, translate: '0 ' + d(40), scale: '.965' }, { opacity: 1, translate: '0 0', scale: '1' }]; }, t: 950, e: SOFT },
    surface: { k: function () { return [{ opacity: 0, translate: '0 ' + d(30), scale: '.985' }, { opacity: 1, translate: '0 0', scale: '1' }]; }, t: 1050, e: SOFT },
    pop:     { k: function () { return [{ opacity: 0, scale: '.3', rotate: '-24deg' }, { opacity: 1, scale: '1', rotate: '0deg' }]; }, t: 620, e: SPRING },
    unroll:  { k: function () { return [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }]; }, t: 1300, e: 'cubic-bezier(.65, 0, .35, 1)' },
    perch:   { k: function () { return [{ opacity: 0, translate: '18px -70px', rotate: '-10deg' }, { opacity: 1, translate: '0 4px', rotate: '2deg', offset: .72 }, { opacity: 1, translate: '0 0', rotate: '0deg' }]; }, t: 1100, e: SOFT },
    etch:    { k: function () { return [{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0 0 0 0)' }]; }, t: 1800, e: 'cubic-bezier(.45, 0, .2, 1)' },
    tide:    { k: function () { return [{ opacity: 0, translate: '0 40px' }, { opacity: 1, translate: '0 0' }]; }, t: 1600, e: SOFT },
    drift:   { k: function () { return [{ opacity: 0, translate: '60px 0' }, { opacity: 1, translate: '0 0' }]; }, t: 1600, e: SOFT },
    slideL:  { k: function () { return [{ opacity: 0, translate: d(-60) + ' 0' }, { opacity: 1, translate: '0 0' }]; }, t: 1100, e: SOFT },
    slideR:  { k: function () { return [{ opacity: 0, translate: d(60) + ' 0' }, { opacity: 1, translate: '0 0' }]; }, t: 1100, e: SOFT },
  };

  var items = new Map();
  function add(el, kind, delay, extra) {
    if (!el || items.has(el)) return;
    var r = el.getBoundingClientRect();
    if (r.bottom <= 0) return;                         // already scrolled past: never hide it
    items.set(el, { kind: kind, delay: delay || 0, extra: extra });
  }
  function all(selector, kind, delay, extra) { document.querySelectorAll(selector).forEach(function (el) { add(el, kind, delay, extra); }); }
  // Siblings arrive one after another, a little apart; long lists cap the wait.
  function stagger(selector, kind, step, start, cap) {
    var seen = new Map();
    document.querySelectorAll(selector).forEach(function (el) {
      var parent = el.parentElement, n = seen.get(parent) || 0;
      seen.set(parent, n + 1);
      add(el, kind, (start || 0) + Math.min(n, cap || 5) * step);
    });
  }

  // ---- what arrives, and how --------------------------------------------------------------------
  all('main .chapter-border', 'unroll');
  all('main .chapter-mark', 'pop', 260);
  all('main :is(.section-title, .about-statement, .writing-title, .contact-title), #playTitle', 'rise', 60);
  all('main :is(.section-note, .writing-description, .writing-link, .writing-languages, .xp-head-right, .xp-timeline-caption, .gallery-tools, .project-tools, .contact-direct, .kicker)', 'fade', 220);
  all('.about-note', 'fade', 160);
  stagger('.about-copy .stat, #about .stat', 'card', 120, 200);
  // Only the cards showing in each rail get an entrance; the ones further along it are ready when scrolled to.
  document.querySelectorAll('.cover-grid').forEach(function (rail) {
    var edge = rail.getBoundingClientRect().right, n = 0;
    Array.prototype.forEach.call(rail.children, function (card) {
      if (card.classList.contains('cover-card') && card.getBoundingClientRect().left < edge) add(card, 'card', 120 + Math.min(n++, 4) * 90);
    });
  });
  stagger('.service-tile', 'card', 90, 80);
  stagger('.xp-row', 'slideL', 90, 60);
  stagger('.test-item', 'card', 140, 80);
  stagger('.writing-entry', 'fade', 110, 360);
  document.querySelectorAll('.collage-row').forEach(function (row, n) { add(row, n % 2 ? 'slideR' : 'slideL', n * 120); });
  all('.brain-canvas, .board-frame, .contact-brief, .showreel-poster', 'surface', 120);
  all('.writing-notebook', 'surface', 180);
  all('.brain-detail, .brain-navigation', 'fade', 240);

  // The chapter art lands last, in its own way.
  all('.pichwai-pond', 'tide', 200);
  all('.kaavi-etch', 'etch', 300);
  all('.ajrakh-fade', 'drift', 200);
  all('.gond-perch', 'perch', 700);
  all('.zari-weave', 'tide', 100);

  // A parent's entrance carries its children (no doubled movement), except the pieces that have a
  // character of their own: the chapter number sticker and the art.
  var own = /^(pop|perch|etch|tide|drift)$/;
  items.forEach(function (s, el) {
    if (own.test(s.kind)) return;
    for (var p = el.parentElement; p; p = p.parentElement) if (items.has(p) && !own.test(items.get(p).kind)) { items.delete(el); return; }
  });
  items.forEach(function (_, el) { el.classList.add('life-wait'); });

  // Pieces drawn by pseudo-elements: the Kalamkari cloth under the notebook, the stamp on the brief.
  var cssPlays = Array.prototype.slice.call(document.querySelectorAll('.writing-desk, #contact .contact-brief'));
  cssPlays.forEach(function (el) { el.classList.add('life-css-wait'); });

  // ---- running them ----------------------------------------------------------------------------
  var running = new Map();
  function done(el) {
    var a = running.get(el); if (a) { a.cancel(); running.delete(el); }
    el.classList.remove('life-wait');
    if (observer) observer.unobserve(el);
    items.delete(el);
  }
  function play(el) {
    var s = items.get(el); if (!s) return;
    observer.unobserve(el);
    var kind = KINDS[s.kind];
    // Arrive at the element's own resting strength, not full strength: the chapter art rests faint
    // (the Ajrakh print at .1, the pond at .28), and used to show at full strength until the entrance
    // ended, then snap back. The class comes off first so its resting opacity can be read; the
    // animation's backwards fill takes over in the same task, so nothing shows in between.
    el.classList.remove('life-wait');
    var rest = parseFloat(getComputedStyle(el).opacity);
    var frames = kind.k().map(function (f) { if (f.opacity === 1 && rest < 1) f.opacity = rest; return f; });
    var a = el.animate(frames, { duration: phone ? Math.round(kind.t * .85) : kind.t, delay: s.delay, easing: kind.e, fill: 'backwards' });
    running.set(el, a);
    a.onfinish = function () { running.delete(el); items.delete(el); };
    if (el.classList.contains('stat')) countUp(el, s.delay);
  }

  // The figures count up as they arrive.
  function countUp(stat, delay) {
    var num = stat.querySelector('[data-count]'); if (!num) return;
    var to = parseInt(num.getAttribute('data-count'), 10); if (!(to > 1)) return;
    var start = performance.now() + delay, span = 1100;
    num.textContent = '0';
    (function tick(now) {
      var p = Math.min(1, Math.max(0, (now - start) / span));
      num.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    })(performance.now());
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting || e.boundingClientRect.bottom <= 0) play(e.target); });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
  items.forEach(function (_, el) { observer.observe(el); });

  var cssObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting && e.boundingClientRect.bottom > 0) return;
      cssObserver.unobserve(e.target);
      e.target.classList.replace('life-css-wait', 'life-css-play');
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  cssPlays.forEach(function (el) { cssObserver.observe(el); });

  // ---- always show everything when it matters ------------------------------------------------------
  function showAll() {
    items.forEach(function (_, el) { done(el); });
    running.forEach(function (_, el) { done(el); });
    cssPlays.forEach(function (el) { el.classList.remove('life-css-wait', 'life-css-play'); });
    observer.disconnect(); cssObserver.disconnect();
  }
  document.addEventListener('focusin', function (e) {
    items.forEach(function (_, el) { if (el.contains(e.target)) done(el); });
  });
  reduce.addEventListener('change', function (e) { if (e.matches) showAll(); });
  window.addEventListener('beforeprint', showAll);
  window.addEventListener('pageshow', function (e) { if (e.persisted) showAll(); });
  new MutationObserver(function () { if (root.getAttribute('data-access') === 'on') showAll(); })
    .observe(root, { attributes: true, attributeFilter: ['data-access'] });
})();
