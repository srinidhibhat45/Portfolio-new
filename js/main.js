/* ============================================================
   SRINIDHI BHAT — Portfolio interactions
   GSAP + ScrollTrigger + Lenis (progressive enhancement)
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Render data-driven content (js/site-data.js + js/cases-data.js) ----------
     Runs first so every later block (cursor binding, scroll reveals, the
     collage marquee, the case viewer, hover previews) sees real DOM instead
     of hand-written HTML. Add new projects/posters by editing site-data.js —
     nothing here needs to change. */
  (function () {
    var SITE = window.SITE_DATA || { work: [], vibe: [], posters: [] };
    var PAGES = window.CASE_PAGES || {};

    function esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }

    // site-data.js keeps pointing at the original .png/.jpg you dropped in —
    // tools/optimize_images.py generates a .webp (and a smaller `-t.webp` for
    // the Craft Wall) next to it, and we swap the extension here. Keeps the
    // "add an object, done" authoring flow while shipping ~85% fewer bytes.
    // If the derivative is missing (script not run yet), onerror falls back
    // to the original so nothing ever renders broken.
    function webp(src, suffix) {
      return String(src).replace(/\.(png|jpe?g)$/i, (suffix || '') + '.webp');
    }
    function fallback(src) {
      return ' onerror="this.onerror=null;this.src=\'' + esc(src) + '\'"';
    }

    // Merge hand-written card metadata with generated per-slug page data
    // into the single lookup the case viewer / hover preview read from.
    window.CASE_DATA = {};
    (SITE.work || []).forEach(function (w) {
      window.CASE_DATA[w.slug] = Object.assign({}, w, PAGES[w.slug]);
    });

    var cardsEl = document.getElementById('cards');
    if (cardsEl && SITE.work && SITE.work.length) {
      cardsEl.innerHTML = SITE.work.map(function (w) {
        return '<a class="card" href="' + esc(w.pdf) + '" target="_blank" rel="noopener" data-case="' + esc(w.slug) + '" data-cursor="view">' +
          '<div class="card-media"><img src="' + esc(webp(w.thumb)) + '" alt="' + esc(w.title) + '"' +
            ' width="1000" height="562" loading="lazy" decoding="async"' + fallback(w.thumb) + '></div>' +
          '<div class="card-body">' +
            '<span class="card-tags">' + esc(w.tags) + '</span>' +
            '<h3>' + esc(w.title) + '</h3>' +
            '<p class="card-blurb">' + esc(w.blurb) + '</p>' +
            '<span class="card-cta">View ↗</span>' +
          '</div>' +
        '</a>';
      }).join('');
    }

    var vibeEl = document.getElementById('vibeCards');
    if (vibeEl && SITE.vibe && SITE.vibe.length) {
      vibeEl.innerHTML = SITE.vibe.map(function (v) {
        var statusCls = v.status === 'building' ? ' is-building' : '';
        var chips = (v.stack || []).map(function (s) { return '<span class="vcard-chip">' + esc(s) + '</span>'; }).join('');
        return '<a class="vcard" href="' + esc(v.href) + '" target="_blank" rel="noopener" data-cursor="view">' +
          '<div class="vcard-bar">' +
            '<span class="vcard-dot"></span><span class="vcard-dot"></span><span class="vcard-dot"></span>' +
            '<span class="vcard-path">' + esc(v.path) + '</span>' +
            '<span class="vcard-status' + statusCls + '">' + esc(v.status) + '</span>' +
          '</div>' +
          '<div class="vcard-body">' +
            '<p class="vcard-cmd"><span class="prompt">$</span>' + esc(v.cmd) + '</p>' +
            '<h3 class="vcard-name">' + esc(v.name) + '</h3>' +
            '<p class="vcard-desc">' + esc(v.desc) + '</p>' +
            '<span class="vcard-stack">' + chips + '</span>' +
            '<span class="vcard-cta">' + esc(v.cta) + ' <span aria-hidden="true">↗</span></span>' +
          '</div>' +
        '</a>';
      }).join('');
    }

    var rowEls = document.querySelectorAll('.collage-row');
    if (rowEls.length && SITE.posters && SITE.posters.length) {
      var sets = Array.prototype.map.call(rowEls, function (row) { return row.querySelector('.collage-set'); });
      sets.forEach(function (set) { if (set) set.innerHTML = ''; });
      var counts = sets.map(function () { return 0; });
      SITE.posters.forEach(function (p) {
        var rowIdx = (p.row >= 1 && p.row <= sets.length) ? p.row - 1
          : counts.indexOf(Math.min.apply(null, counts)); // no row given -> balance automatically
        var set = sets[rowIdx];
        if (!set) return;
        counts[rowIdx]++;
        // The wall only ever shows these at <=260px tall, so it gets the small
        // `-t.webp`; data-full points the lightbox at the full-size file, which
        // is fetched only once someone actually opens one.
        // A <button>, not a <figure>: this opens the lightbox, so it has to be
        // reachable and operable from the keyboard like any other control.
        set.insertAdjacentHTML('beforeend',
          '<button class="gi" type="button" aria-label="View ' + esc(p.alt || 'poster') + ' full size">' +
          '<img src="' + esc(webp(p.src, '-t')) + '"' +
          ' data-full="' + esc(webp(p.src)) + '"' +
          ' alt="' + esc(p.alt || 'Poster') + '"' +
          ' loading="lazy" decoding="async"' + fallback(p.src) + '></button>');
      });
    }
  })();

  var hasGSAP = typeof gsap !== 'undefined';
  var hasST = hasGSAP && typeof ScrollTrigger !== 'undefined';
  var staticMode = /[?&]static/.test(location.search);
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches || staticMode;
  var isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  var isMobile = window.matchMedia('(max-width: 900px)').matches;

  if (hasST) {
    gsap.registerPlugin(ScrollTrigger);
    // Mobile in-app browsers (Instagram, etc.) resize the viewport as their
    // chrome collapses/expands mid-scroll; without this, ScrollTrigger's
    // auto-refresh on that resize desyncs scrub positions (e.g. hero
    // parallax stuck offset after scrolling down then back up).
    ScrollTrigger.config({ ignoreMobileResize: true });
  }

  /* ---------- Smooth scroll (Lenis) ---------- */
  var lenis = null;
  if (typeof Lenis !== 'undefined' && !reduceMotion && !isTouch) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })();
    if (hasST) lenis.on('scroll', ScrollTrigger.update);
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      var target = id.length > 1 && document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      if (lenis) lenis.scrollTo(target, { offset: 0 });
      else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      // preventDefault also cancels the focus move the browser would normally
      // do for an in-page link, which would strand a keyboard user's focus at
      // the top of the page — including anyone using the skip link. Sections
      // aren't focusable by default, so make the target programmatically
      // focusable just long enough to receive it.
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
        target.addEventListener('blur', function once() {
          target.removeAttribute('tabindex');
          target.removeEventListener('blur', once);
        });
      }
      target.focus({ preventScroll: true });
    });
  });

  /* ---------- Back-to-top button ---------- */
  var backToTop = document.getElementById('backToTop');
  if (backToTop) {
    var toggleBackToTop = function () {
      backToTop.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.6);
    };
    window.addEventListener('scroll', toggleBackToTop, { passive: true });
    toggleBackToTop();
  }

  /* ---------- Word-wrap for split reveals (preserves <br>, <em>) ---------- */
  function wrapWords(el) {
    Array.prototype.slice.call(el.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        var parts = node.textContent.split(/(\s+)/).filter(Boolean);
        var frag = document.createDocumentFragment();
        parts.forEach(function (part) {
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          // The heading fonts use very tight line-heights (as low as 0.9) for
          // display sizing, which leaves no room for serif overshoot, italic
          // swashes, or ascenders/descenders once each word is boxed into its
          // own overflow:hidden mask for the reveal animation. Padding the
          // mask out (and pulling it back in with an equal negative margin,
          // so layout/line-wrapping is unaffected) gives glyphs breathing
          // room before the box clips them.
          var wm = document.createElement('span'); wm.className = 'wm';
          wm.style.display = 'inline-block'; wm.style.overflow = 'hidden'; wm.style.verticalAlign = 'top';
          wm.style.padding = '0.3em 0.2em'; wm.style.margin = '-0.3em -0.2em';
          var w = document.createElement('span'); w.className = 'w';
          w.style.display = 'inline-block'; w.style.lineHeight = '1.2'; w.textContent = part;
          wm.appendChild(w); frag.appendChild(wm);
        });
        el.replaceChild(frag, node);
      } else if (node.nodeType === 1 && node.nodeName !== 'BR') {
        wrapWords(node);
      }
    });
  }
  document.querySelectorAll('[data-split]').forEach(wrapWords);

  /* ---------- Preloader ---------- */
  var preloader = document.getElementById('preloader');
  var preloaderDone = false;
  function killPreloader() {
    if (preloaderDone) return;
    preloaderDone = true;
    if (window.__killPreloaderFailsafe) clearTimeout(window.__killPreloaderFailsafe);
    if (preloader) preloader.style.display = 'none';
    document.body.style.overflow = '';
    heroIntro();
  }
  setTimeout(killPreloader, 4500); // failsafe (background tabs suspend rAF)

  var nameEl = document.getElementById('preloaderName');
  if (nameEl) {
    nameEl.innerHTML = nameEl.textContent.split('').map(function (c) {
      return c === ' ' ? ' ' : '<span class="pl-w" style="display:inline-block">' + c + '</span>';
    }).join('');
  }

  if (preloader && hasGSAP && !reduceMotion && !document.hidden) {
    document.body.style.overflow = 'hidden';
    var count = { v: 0 };
    var countEl = document.getElementById('preloaderCount');
    var fill = document.getElementById('preloaderFill');
    var tl = gsap.timeline({ onComplete: killPreloader });
    tl.from('.pl-w', { yPercent: 120, opacity: 0, duration: 0.7, stagger: 0.03, ease: 'expo.out' }, 0);
    if (fill) tl.to(fill, { scaleX: 1, duration: 1.5, ease: 'power2.inOut' }, 0.1);
    tl.to(count, {
      v: 100, duration: 1.5, ease: 'power2.inOut',
      onUpdate: function () { if (countEl) countEl.textContent = ('0' + Math.round(count.v)).slice(-2); }
    }, 0.1);
    tl.to('.pl-w', { yPercent: -120, opacity: 0, duration: 0.55, stagger: 0.02, ease: 'expo.in' }, '+=0.15');
    tl.to(preloader, { clipPath: 'inset(0 0 100% 0)', duration: 0.8, ease: 'expo.inOut' }, '-=0.3');

    // The counter used to run to 100 on a fixed ~2.4s timeline no matter how
    // fast the page was actually ready — which, now that the payload is a
    // fraction of what it was, made the preloader the slowest thing on the
    // site. It's a progress indicator, so let it track real progress: once
    // load fires, ease the timeline up to 3x and let it finish. The ramp keeps
    // it feeling like an animation rather than a jump cut, and the 4.5s
    // failsafe above still covers a load event that never arrives.
    var sped = false;
    function raceToEnd() {
      if (sped) return;
      sped = true;
      gsap.to(tl, { timeScale: 3, duration: 0.25, ease: 'power2.in' });
    }
    if (document.readyState === 'complete') raceToEnd();
    else window.addEventListener('load', raceToEnd, { once: true });
  } else {
    killPreloader();
  }

  /* ---------- Hero intro ---------- */
  function heroIntro() {
    if (!hasGSAP || reduceMotion || document.hidden) return;
    var tl = gsap.timeline();
    tl.from('.hero-eyebrow, .hero-name .hn-1, .hero-name .hn-2, .hero-role', {
      yPercent: 100, opacity: 0, duration: 1.1, stagger: 0.09, ease: 'expo.out'
    }, 0.05);
    tl.from('.hero-figure', { opacity: 0, scale: 0.92, yPercent: 4, duration: 1.3, ease: 'expo.out' }, 0.35);
    tl.from('.hero-bio, .hero-seal, .hero-foot, .nav', {
      opacity: 0, y: 22, duration: 0.9, stagger: 0.08, ease: 'power3.out', clearProps: 'opacity,transform'
    }, 0.7);
  }

  /* ---------- Custom cursor ---------- */
  var cursor = document.getElementById('cursor');
  var cursorLabel = document.getElementById('cursorLabel');
  if (cursor && !isTouch && hasGSAP) {
    // Only now hide the native cursor. Doing it from CSS alone would leave a
    // pointerless page if GSAP failed to load or this branch never ran.
    document.documentElement.classList.add('has-cursor');
    var cx = gsap.quickTo(cursor, 'x', { duration: 0.18, ease: 'power3.out' });
    var cy = gsap.quickTo(cursor, 'y', { duration: 0.18, ease: 'power3.out' });
    window.addEventListener('mousemove', function (e) { cursor.style.opacity = '1'; cx(e.clientX); cy(e.clientY); });
    // Over text fields the caret matters more than the dot: give the native
    // I-beam back and get the custom cursor out of the way.
    document.querySelectorAll('input, textarea, select').forEach(function (el) {
      el.addEventListener('mouseenter', function () { cursor.classList.add('is-hidden'); });
      el.addEventListener('mouseleave', function () { cursor.classList.remove('is-hidden'); });
    });
    function bindCursor(sel, cls, label) {
      document.querySelectorAll(sel).forEach(function (el) {
        el.addEventListener('mouseenter', function () { cursor.classList.add(cls); if (label) cursorLabel.textContent = label; });
        el.addEventListener('mouseleave', function () { cursor.classList.remove(cls); if (label) cursorLabel.textContent = ''; });
      });
    }
    bindCursor('[data-cursor="hover"], .nav-links a, .contact-links a', 'is-hover', '');
    bindCursor('[data-cursor="view"]', 'is-view', 'View ↗');
    bindCursor('.gi', 'is-view', 'Open');
  }

  /* ---------- Mobile menu ---------- */
  var burger = document.getElementById('navBurger');
  var menu = document.getElementById('mobileMenu');
  function closeMenu() {
    if (!menu) return;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    if (burger) {
      burger.setAttribute('aria-expanded', 'false');
      burger.children[0].style.transform = '';
      burger.children[1].style.transform = '';
    }
  }
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('is-open');
      menu.setAttribute('aria-hidden', String(!open));
      burger.setAttribute('aria-expanded', String(open));
      burger.children[0].style.transform = open ? 'translateY(4px) rotate(45deg)' : '';
      burger.children[1].style.transform = open ? 'translateY(-4px) rotate(-45deg)' : '';
    });
  }

  /* ---------- Theme toggle (light default, dark opt-in, persisted) ---------- */
  (function () {
    var toggle = document.getElementById('themeToggle');
    if (!toggle) return;
    var metaTheme = document.querySelector('meta[name="theme-color"]');
    var COLORS = { light: '#f6f4ef', dark: '#0b1020' };
    function apply(theme) {
      if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
      else document.documentElement.removeAttribute('data-theme');
      toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      if (metaTheme) metaTheme.setAttribute('content', COLORS[theme]);
    }
    function current() {
      return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    }
    apply(current());
    toggle.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      apply(next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  })();

  /* ---------- Scroll reveals ---------- */
  if (hasST && !reduceMotion) {
    document.querySelectorAll('[data-split]').forEach(function (el) {
      gsap.from(el.querySelectorAll('.w'), {
        yPercent: 115, duration: 0.9, stagger: 0.045, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });
    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      gsap.fromTo(el, { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
    });
    // Cards: staggered load reveal
    gsap.utils.toArray('.card').forEach(function (card, i) {
      gsap.fromTo(card,
        { opacity: 0, y: 64, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'power3.out',
          delay: (i % 2) * 0.08,
          scrollTrigger: { trigger: card, start: 'top 92%' } });
    });
    // count-up
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      var obj = { v: 0 };
      gsap.to(obj, {
        v: target, duration: 1.6, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%' },
        onUpdate: function () { el.textContent = Math.round(obj.v); }
      });
    });
    // hero parallax (desktop only)
    if (!isMobile) {
      gsap.to('.hero-figure', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.hero-orb-1', { yPercent: 22, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.hero-orb-2', { yPercent: -16, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.hero-mesh', { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    }
  } else {
    document.querySelectorAll('[data-reveal]').forEach(function (el) { el.style.opacity = 1; });
    document.querySelectorAll('[data-count]').forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
  }

  /* ---------- Seamless infinite marquee ----------
     Shared by the gallery collage rows and the testimonials strip.
     Measures a single set's width only AFTER its images have real
     dimensions, then clones enough copies to cover 2× viewport so the
     modulo wrap is invisible — no jerky jump, scrolls forever. */
  function initMarquee(row, set) {
    if (!set) return;

    var gapPx = parseFloat(getComputedStyle(set).gap) || 0;
    var track = document.createElement('div');
    track.style.display = 'flex';
    track.style.gap = gapPx + 'px';
    track.style.width = 'max-content';
    track.style.willChange = 'transform';
    row.appendChild(track);
    track.appendChild(set);

    var dir = parseFloat(row.getAttribute('data-dir')) || 1;   // 1 = leftward, -1 = rightward
    var pxPerSec = 60;
    var speedAttr = parseFloat(row.getAttribute('data-speed'));
    if (speedAttr) pxPerSec = 2400 / speedAttr;

    var setWidth = 0, x = 0, last = 0, paused = false, started = false;

    function ensureFill() {
      var need = window.innerWidth * 2 + setWidth;
      while (track.getBoundingClientRect().width < need && track.children.length < 48) {
        var clone = set.cloneNode(true);
        // Each poster is a <button> so the lightbox is keyboard-operable, which
        // means every duplicate the marquee makes to fill the row would other-
        // wise be another tab stop — up to 48 copies per row, three rows, all
        // announcing the same posters. Only the original set stays reachable.
        clone.setAttribute('aria-hidden', 'true');
        clone.querySelectorAll('.gi').forEach(function (b) { b.tabIndex = -1; });
        track.appendChild(clone);
      }
    }
    function tryStart() {
      if (started || reduceMotion) return;
      setWidth = set.getBoundingClientRect().width + gapPx;
      if (setWidth <= gapPx + 10) return; // images not measured yet
      ensureFill();
      started = true;
      x = dir > 0 ? 0 : -setWidth;
      last = performance.now();
      requestAnimationFrame(tick);
    }
    function tick(now) {
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!paused && setWidth > 0) {
        x -= pxPerSec * dt * dir;
        if (x <= -setWidth) x += setWidth;
        else if (x >= 0) x -= setWidth;
        track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
      }
      requestAnimationFrame(tick);
    }

    row.addEventListener('mouseenter', function () { paused = true; });
    row.addEventListener('mouseleave', function () { paused = false; });

    // The posters are `loading="lazy"` and sit ~7000px down the page, so they
    // have no width at page load and measuring now would size the track from
    // nothing. Wait until the row is near the viewport (which is also what
    // triggers the lazy fetch), then poll until the images report real widths.
    // An earlier version polled on a fixed 8s timer from page load — that
    // expired long before a scrolling visitor ever reached the wall.
    var poll = null;
    function beginWatching() {
      if (poll || started) return;
      set.querySelectorAll('img').forEach(function (im) {
        if (im.complete) return;
        im.addEventListener('load', tryStart, { once: true });
      });
      tryStart();
      poll = setInterval(function () {
        if (started) { clearInterval(poll); poll = null; }
        else tryStart();
      }, 300);
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        beginWatching();
      }, { rootMargin: '600px 0px' });
      io.observe(row);
    } else {
      beginWatching();
    }

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        if (!started) { tryStart(); return; }
        setWidth = set.getBoundingClientRect().width + gapPx;
        ensureFill();
      }, 150);
    });
  }

  document.querySelectorAll('.collage-row').forEach(function (row) {
    initMarquee(row, row.querySelector('.collage-set'));
  });

  /* ---------- Focus trap (shared by the lightbox and the case viewer) ----------
     Both overlays declare aria-modal="true", which tells assistive tech the rest
     of the page is inert — but that's a promise the browser doesn't keep on its
     own. Without this, Tab walks straight out of the dialog and into the work
     cards behind it while the overlay still covers the screen. */
  var FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
  function trapFocus(container) {
    return function (e) {
      if (e.key !== 'Tab') return;
      var items = Array.prototype.filter.call(
        container.querySelectorAll(FOCUSABLE),
        function (el) { return el.offsetParent !== null || el === document.activeElement; }
      );
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
  }

  /* ---------- Lightbox ---------- */
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var lightboxClose = document.getElementById('lightboxClose');
  if (lightbox) {
    var lbTrap = trapFocus(lightbox);
    var lbLastFocus = null;
    document.addEventListener('click', function (e) {
      var fig = e.target.closest && e.target.closest('.gi');
      if (!fig) return;
      var img = fig.querySelector('img');
      if (!img) return;
      // The wall renders a downscaled thumb; open the full-size file here.
      lightboxImg.src = img.getAttribute('data-full') || img.currentSrc || img.src;
      lightboxImg.alt = img.alt || 'Artwork enlarged';
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      if (lenis) lenis.stop();
      lbLastFocus = document.activeElement;
      document.addEventListener('keydown', lbTrap);
      lightboxClose.focus();
    });
    function closeLightbox() {
      if (!lightbox.classList.contains('is-open')) return;
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      if (lenis) lenis.start();
      document.removeEventListener('keydown', lbTrap);
      if (lbLastFocus && lbLastFocus.focus) lbLastFocus.focus();
    }
    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLightbox(); });
  }

  /* ---------- Case viewer (native screens, no PDF download) ---------- */
  (function () {
    var DATA = window.CASE_DATA || {};
    var cv = document.getElementById('caseViewer');
    if (!cv) return;
    var scroll = document.getElementById('cvScroll');
    var titleEl = document.getElementById('cvTitle');
    var tagsEl = document.getElementById('cvTags');
    var pdfEl = document.getElementById('cvPdf');
    var protoEl = document.getElementById('cvProto');
    var closeEl = document.getElementById('cvClose');
    var progressEl = document.getElementById('cvProgress');
    var fillEl = document.getElementById('cvBarFill');
    var total = 1, lastFocus = null;
    var cvTrap = trapFocus(cv);
    function pad(n) { return ('0' + n).slice(-2); }

    function build(c) {
      var stage = document.createElement('div');
      stage.className = 'cv-stage ' + (c.layout === 'page' ? 'is-page' : 'is-deck');
      c.pages.forEach(function (p, i) {
        var img = document.createElement('img');
        img.src = p.src; img.width = p.w; img.height = p.h;
        img.loading = i < 2 ? 'eager' : 'lazy';
        img.decoding = 'async';
        img.alt = c.title + ' — screen ' + (i + 1);
        if (c.layout === 'page') { stage.appendChild(img); }
        else { var f = document.createElement('figure'); f.className = 'cv-slide'; f.appendChild(img); stage.appendChild(f); }
      });
      scroll.innerHTML = '';
      scroll.appendChild(stage);
    }
    function updateProgress() {
      var max = scroll.scrollHeight - scroll.clientHeight;
      var frac = max > 0 ? Math.min(1, Math.max(0, scroll.scrollTop / max)) : 0;
      fillEl.style.width = (frac * 100).toFixed(1) + '%';
      var cur = Math.min(total, Math.floor(frac * (total - 1) + 0.5) + 1);
      progressEl.textContent = pad(cur) + ' / ' + pad(total);
    }
    function openCase(slug) {
      var c = DATA[slug];
      if (!c) return false;
      titleEl.textContent = c.title;
      tagsEl.textContent = c.tags;
      pdfEl.href = c.pdf;
      if (protoEl) {
        if (c.prototypeUrl) { protoEl.href = c.prototypeUrl; protoEl.hidden = false; }
        else { protoEl.hidden = true; protoEl.removeAttribute('href'); }
      }
      total = c.pages.length;
      build(c);
      lastFocus = document.activeElement;
      cv.classList.add('is-open');
      cv.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      if (lenis) lenis.stop();
      scroll.scrollTop = 0;
      updateProgress();
      document.addEventListener('keydown', cvTrap);
      closeEl.focus();
      return true;
    }
    function closeCase() {
      cv.classList.remove('is-open');
      cv.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lenis) lenis.start();
      document.removeEventListener('keydown', cvTrap);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    scroll.addEventListener('scroll', updateProgress, { passive: true });
    closeEl.addEventListener('click', closeCase);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && cv.classList.contains('is-open')) closeCase();
    });
    document.querySelectorAll('.card[data-case]').forEach(function (card) {
      card.addEventListener('click', function (e) {
        var slug = card.getAttribute('data-case');
        if (DATA[slug]) { e.preventDefault(); openCase(slug); }
        // no data for slug -> fall through to href (PDF) as graceful fallback
      });
    });
  })();

  /* ---------- Work view switcher (Selected Work <-> vibe-coded) ---------- */
  (function () {
    var tabs = document.querySelectorAll('.work-tab');
    if (!tabs.length) return;
    var panels = { work: document.getElementById('cards'), vibe: document.getElementById('vibeCards') };
    var kickerEl = document.getElementById('workKicker');
    var titleEl = document.getElementById('workTitle');
    var noteEl = document.getElementById('workNote');
    var COPY = {
      work: {
        kicker: '( Selected work — 01 / 10 )',
        title: 'Selected <em>Work</em>',
        note: 'Ten case studies across product design, landing pages &amp; brand concepts. Tap any card to view the full screens — right here, no downloads. ↗'
      },
      vibe: {
        kicker: '( Side projects · shipped after midnight )',
        title: "Sh*t I've <em>Vibe Coded</em>",
        note: 'Four things I built solo with an AI pair-programmer and way too much coffee. Live links, zero polish guarantees. ↗'
      }
    };
    var current = 'work';
    function activate(name) {
      if (name === current || !panels[name]) return;
      var from = panels[current], to = panels[name];
      current = name;
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-tab') === name;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
      });
      if (kickerEl) kickerEl.innerHTML = COPY[name].kicker;
      if (titleEl) titleEl.innerHTML = COPY[name].title;
      if (noteEl) noteEl.innerHTML = COPY[name].note;
      from.classList.add('is-entering');
      setTimeout(function () {
        from.hidden = true;
        to.hidden = false;
        to.classList.add('is-entering');
        void to.offsetWidth; // force reflow so removing the class below actually transitions
        to.classList.remove('is-entering');
        // the two panels are very different heights (10 cards vs 4), so the
        // section height jumps instantly here -- re-anchor the viewport to a
        // consistent spot on the section instead of leaving the scroll
        // position wherever it happened to be relative to the OLD height
        var section = document.getElementById('work');
        var anchor = section.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top: Math.max(0, anchor), behavior: reduceMotion ? 'auto' : 'smooth' });
        // every section below (experience, gallery, ...) just shifted with
        // the height change, but their reveal-on-scroll triggers keep the
        // stale pixel offsets from page load -- refresh so ScrollTrigger
        // re-measures against the new layout, or those reveals fire at the
        // wrong scroll position (reads as a dead gap before the next section)
        if (hasST) ScrollTrigger.refresh();
      }, 220);
    }
    tabs.forEach(function (t) {
      t.addEventListener('click', function () { activate(t.getAttribute('data-tab')); });
    });
  })();

  /* ---------- Card hover preview (peek at first 3 case-study pages) ---------- */
  (function () {
    var preview = document.getElementById('cardPreview');
    if (!preview || isTouch) return;
    var DATA = window.CASE_DATA || {};
    var moveX = hasGSAP ? gsap.quickTo(preview, 'x', { duration: 0.35, ease: 'power3.out' }) : null;
    var moveY = hasGSAP ? gsap.quickTo(preview, 'y', { duration: 0.35, ease: 'power3.out' }) : null;
    function move(e) {
      if (moveX && moveY) { moveX(e.clientX); moveY(e.clientY); }
      else { preview.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)'; }
    }
    document.querySelectorAll('.card[data-case]').forEach(function (card) {
      var slug = card.getAttribute('data-case');
      var c = DATA[slug];
      if (!c || !c.pages || !c.pages.length) return;
      card.addEventListener('mouseenter', function (e) {
        preview.innerHTML = c.pages.slice(0, 3).map(function (p) {
          return '<div class="card-preview-item"><img src="' + p.src + '" alt="" loading="lazy"></div>';
        }).join('');
        preview.classList.add('is-visible');
        move(e);
      });
      card.addEventListener('mousemove', move);
      card.addEventListener('mouseleave', function () { preview.classList.remove('is-visible'); });
    });
  })();

  /* ---------- Contact form (Netlify AJAX submit) ---------- */
  (function () {
    var form = document.querySelector('.contact-form');
    if (!form) return;
    var statusEl = document.getElementById('cfStatus');
    var toastEl = document.getElementById('cfToast');
    var btn = form.querySelector('.cf-submit');
    var btnTxt = form.querySelector('.cf-submit-txt');
    var toastTimer = null;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var hp = form.querySelector('[name="bot-field"]');
      if (hp && hp.value) return; // honeypot tripped
      if (typeof form.reportValidity === 'function' && !form.reportValidity()) return;
      var body = new URLSearchParams(new FormData(form)).toString();
      if (btn) btn.disabled = true;
      if (btnTxt) btnTxt.textContent = 'Sending…';
      statusEl.className = 'cf-status';
      statusEl.textContent = '';
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body
      }).then(function (res) {
        if (!res.ok) throw new Error('status ' + res.status);
        form.reset();
        if (btn) btn.disabled = false;
        if (btnTxt) btnTxt.textContent = 'Send it over';
        if (toastEl) {
          clearTimeout(toastTimer);
          toastEl.classList.add('is-visible');
          toastEl.setAttribute('aria-hidden', 'false');
          toastTimer = setTimeout(function () {
            toastEl.classList.remove('is-visible');
            toastEl.setAttribute('aria-hidden', 'true');
          }, 5000);
        }
      }).catch(function () {
        if (btn) btn.disabled = false;
        if (btnTxt) btnTxt.textContent = 'Send it over';
        statusEl.className = 'cf-status is-err';
        statusEl.textContent = 'Something went wrong — please email srinidhibhat45@gmail.com instead.';
      });
    });
  })();

  /* ---------- Magnetic ---------- */
  if (!isTouch && hasGSAP && !reduceMotion) {
    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      var mx = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out' });
      var my = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out' });
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        mx((e.clientX - (r.left + r.width / 2)) * 0.22);
        my((e.clientY - (r.top + r.height / 2)) * 0.22);
      });
      el.addEventListener('mouseleave', function () { mx(0); my(0); });
    });
  }

  /* ---------- Clocks (IST) ---------- */
  function fmt() {
    try {
      return new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' }).format(new Date());
    } catch (e) { return '--:--'; }
  }
  function tick() {
    var t = fmt();
    var a = document.getElementById('localTime'); if (a) a.textContent = t;
    var b = document.getElementById('heroTime'); if (b) b.textContent = t;
  }
  tick();
  setInterval(tick, 30000);
})();
