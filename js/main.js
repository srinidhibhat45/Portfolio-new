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
      cardsEl.innerHTML = SITE.work.map(function (w, i) {
        return '<a class="card" href="' + esc(w.pdf) + '" target="_blank" rel="noopener" data-case="' + esc(w.slug) + '">' +
          '<div class="card-media"><span class="card-number">' + ('0' + (i + 1)).slice(-2) + ' / DESIGN STUDY</span><img src="' + esc(webp(w.thumb)) + '" alt="' + esc(w.title) + '"' +
            ' width="1000" height="562" loading="lazy" decoding="async"' + fallback(w.thumb) + '></div>' +
          '<div class="card-body">' +
            '<span class="card-tags">' + esc(w.tags) + '</span>' +
            '<h3>' + esc(w.title) + '</h3>' +
            '<p class="card-blurb">' + esc(w.blurb) + '</p>' +
            '<span class="card-cta">Explore case study <span aria-hidden="true">↗</span></span>' +
          '</div>' +
        '</a>';
      }).join('');
    }

    var vibeEl = document.getElementById('playGrid');
    if (vibeEl && SITE.vibe && SITE.vibe.length) {
      var priority = ['Arkitype', 'Earthlog', 'AppleCider', 'HexChess', 'DashF1', 'Vansh Vriksha', 'Hued'];
      var products = SITE.vibe.slice().sort(function (a, b) {
        var ai = priority.indexOf(a.name), bi = priority.indexOf(b.name);
        return (ai < 0 ? 100 : ai) - (bi < 0 ? 100 : bi);
      });
      vibeEl.innerHTML = products.map(function (v) {
        var media = (window.PROJECT_MEDIA || {})[v.name];
        var starred = ['Arkitype', 'Earthlog', 'AppleCider'].includes(v.name);
        var chips = (v.stack || []).map(function (tool) { return '<span class="vcard-chip">' + esc(tool) + '</span>'; }).join('');
        var preview = media ? '<div class="play-product-preview product-media-' + esc(media.kind) + '"><img src="' + esc(media.src) + '" alt="' + esc(media.alt) + '" loading="lazy" decoding="async" width="1280" height="720"></div>' : '';
        return '<a class="play-card" href="' + esc(v.href) + '" target="_blank" rel="noopener">' + preview +
          '<div class="play-meta">' + (starred ? '<span class="starred-label"><span aria-hidden="true">✦</span> Starred</span>' : '<span>INDEPENDENT PRODUCT</span>') +
          (v.status === 'building' ? '<span class="product-building">In development</span>' : '') + '</div>' +
          '<div class="play-card-head"><h3>' + esc(v.name) + '</h3><span aria-hidden="true">↗</span></div>' +
          '<p>' + esc(v.desc) + '</p><span class="play-stack">' + chips + '</span>' +
          '<span class="play-card-cta">' + esc(v.cta) + ' <span aria-hidden="true">↗</span></span></a>';
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
  if (typeof Lenis !== 'undefined' && !reduceMotion && !isTouch && !isMobile) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    (function raf(t) { if (lenis) lenis.raf(t); requestAnimationFrame(raf); })();
    window.matchMedia('(max-width: 900px)').addEventListener('change', function(event) { if(event.matches && lenis) {lenis.destroy();lenis=null;} });
    if (hasST) lenis.on('scroll', ScrollTrigger.update);
  }

  /* Keep overlays isolated for keyboard, touch and assistive technology. */
  document.addEventListener('portfolio:before-dialog', function () { closeMenu(); });
  document.addEventListener('portfolio:dialog', function (event) {
    if (lenis) { if (event.detail.open) lenis.stop(); else lenis.start(); }
  });
  document.addEventListener('portfolio:layout', function () { if (hasST) ScrollTrigger.refresh(); });
  var activeOverlay = null, inertSiblings = [], previousOverflow = '';
  function lockOverlay(overlay, exceptions) {
    activeOverlay = overlay;
    previousOverflow = document.body.style.overflow;
    inertSiblings = Array.prototype.filter.call(document.body.children, function (el) {
      return el !== overlay && el.tagName !== 'SCRIPT' && (!exceptions || exceptions.indexOf(el) === -1);
    }).map(function (el) {
      var saved = { el: el, inert: el.inert };
      el.inert = true;
      return saved;
    });
    overlay.inert = false;
    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();
  }
  function unlockOverlay(overlay) {
    if (activeOverlay !== overlay) return;
    overlay.inert = true;
    inertSiblings.forEach(function (saved) { saved.el.inert = saved.inert; });
    inertSiblings = [];
    activeOverlay = null;
    document.body.style.overflow = previousOverflow;
    if (lenis) lenis.start();
  }
  function focusOverlay(overlay, control) {
    // Focus synchronously: background tabs may suspend animation frames.
    void overlay.offsetWidth;
    if (activeOverlay === overlay) control.focus({ preventScroll: true });
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      var target = id.length > 1 && document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      if (lenis) lenis.scrollTo(target, { offset: -document.getElementById('nav').offsetHeight - 24 });
      else window.scrollTo({
        top: Math.max(0, target.getBoundingClientRect().top + window.scrollY - document.getElementById('nav').offsetHeight - 24),
        behavior: reduceMotion ? 'auto' : 'smooth'
      });
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

  /* A short entrance on the actual page, with no blocking splash screen. */
  if (window.__killPreloaderFailsafe) clearTimeout(window.__killPreloaderFailsafe);
  if (hasGSAP && !reduceMotion && !document.hidden) {
    gsap.from('.heritage-greeting, .heritage-role', {
      y: 12, opacity: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out', clearProps: 'opacity,transform'
    });
    gsap.from('.heritage-title', { y: 22, opacity: 0, duration: 1, ease: 'power3.out', clearProps: 'opacity,transform' });
    gsap.from('.heritage-photo', { y: 28, opacity: 0, duration: 1, delay: 0.15, ease: 'power3.out', clearProps: 'opacity,transform' });
    gsap.from('.heritage-intro, .heritage-paths', { y: 14, opacity: 0, duration: 0.8, delay: 0.3, stagger: 0.08, ease: 'power3.out', clearProps: 'opacity,transform' });
  }

  /* ---------- Mobile menu ---------- */
  var burger = document.getElementById('navBurger');
  var menu = document.getElementById('mobileMenu');
  var menuTrap = menu ? trapFocus(menu) : null;
  function closeMenu(restoreFocus) {
    if (!menu || !menu.classList.contains('is-open')) return;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    unlockOverlay(menu);
    document.removeEventListener('keydown', menuTrap);
    if (burger) {
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Open menu');
      burger.children[0].style.transform = '';
      burger.children[1].style.transform = '';
      if (restoreFocus) burger.focus();
    }
  }
  if (burger && menu) {
    burger.addEventListener('click', function () {
      if (menu.classList.contains('is-open')) { closeMenu(true); return; }
      menu.classList.add('is-open');
      menu.setAttribute('aria-hidden', 'false');
      burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', 'Close menu');
      burger.children[0].style.transform = 'translateY(4px) rotate(45deg)';
      burger.children[1].style.transform = 'translateY(-4px) rotate(-45deg)';
      lockOverlay(menu, [document.getElementById('nav')]);
      document.addEventListener('keydown', menuTrap);
      focusOverlay(menu, menu.querySelector('a'));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu(true);
    });
    window.matchMedia('(max-width: 1000px)').addEventListener('change', function (e) {
      if (!e.matches) closeMenu(true);
    });
  }

  /* ---------- Theme toggle (light default, dark opt-in, persisted) ---------- */
  (function () {
    var toggle = document.getElementById('themeToggle');
    if (!toggle) return;
    var metaTheme = document.querySelector('meta[name="theme-color"]');
    var COLORS = { light: '#f6f4ef', dark: '#1d211f' };
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

  /* Scroll entrances are handled by scroll-motion.js after all content is ready.
     Counts remain visible when animation libraries are unavailable. */
  document.querySelectorAll('[data-count]').forEach(function (el) {
    el.textContent = el.getAttribute('data-count');
  });

  /* ---------- Seamless infinite marquee ----------
     Shared by the gallery collage rows and the testimonials strip.
     Measures a single set's width only AFTER its images have real
     dimensions, then clones enough copies to cover 2× viewport so the
     modulo wrap is invisible — no jerky jump, scrolls forever. */
  function initMarquee(row, set) {
    if (!set || reduceMotion) return;

    var gapPx = parseFloat(getComputedStyle(set).gap) || 0;
    var track = document.createElement('div');
    track.className = 'collage-track';
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

    var setWidth = 0, x = 0, last = 0, paused = false, focusPaused = false, started = false, inView = false;

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
      if (started || reduceMotion || row.closest('.is-browsing')) return;
      if (!Array.from(set.querySelectorAll('img')).every(function(img){return img.complete;})) return;
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
      if (inView && !paused && !focusPaused && !row.closest('[data-motion-paused="true"]') && !document.hidden && !row.closest('.is-browsing') && !activeOverlay && setWidth > 0) {
        x -= pxPerSec * dt * dir;
        if (x <= -setWidth) x += setWidth;
        else if (x >= 0) x -= setWidth;
        track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
      }
      requestAnimationFrame(tick);
    }

    row.addEventListener('mouseenter', function () { paused = true; });
    row.addEventListener('mouseleave', function () { paused = false; });
    row.addEventListener('focusin', function (event) {
      focusPaused = true;
      if (!started || row.closest('.is-browsing')) return;
      // Keep the original, keyboard-reachable artwork visible while the loop rests.
      row.scrollLeft = 0;
      var bounds=row.getBoundingClientRect(),item=event.target.getBoundingClientRect();
      if (item.left<bounds.left) x+=bounds.left-item.left+12;
      else if (item.right>bounds.right) x-=item.right-bounds.right+12;
      x=Math.max(-setWidth,Math.min(0,x));
      track.style.transform='translate3d('+x.toFixed(2)+'px,0,0)';
    });
    row.addEventListener('focusout', function (e) { focusPaused = row.contains(e.relatedTarget); });

    // The posters are `loading="lazy"` and sit ~7000px down the page, so they
    // have no width at page load and measuring now would size the track from
    // nothing. Wait until the row is near the viewport (which is also what
    // triggers the lazy fetch), then poll until the images report real widths.
    // An earlier version polled on a fixed 8s timer from page load — that
    // expired long before a scrolling visitor ever reached the wall.
    var poll = null;
    function beginWatching() {
      if (poll || started || row.closest('.is-browsing')) return;
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
        inView = entries[0].isIntersecting;
        if (inView) beginWatching();
      }, { rootMargin: '600px 0px' });
      io.observe(row);
    } else {
      inView = true;beginWatching();
    }

    row.closest('.collage').addEventListener('galleryviewchange', function () {
      if (row.closest('.is-browsing')) { clearInterval(poll); poll = null; return; }
      if (!started) { beginWatching(); return; }
      setWidth = set.getBoundingClientRect().width + gapPx;
      ensureFill();
    });

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        if (row.closest('.is-browsing')) return;
        if (!started) { tryStart(); return; }
        setWidth = set.getBoundingClientRect().width + gapPx;
        ensureFill();
      }, 150);
    });
  }

  var collage = document.getElementById('collage');
  var browseButton = document.getElementById('galleryBrowse');
  var galleryHint = document.getElementById('galleryHint');
  function browseGallery(browsing) {
    collage.classList.toggle('is-browsing', browsing);
    collage.dispatchEvent(new Event('galleryviewchange'));
    browseButton.setAttribute('aria-pressed', String(browsing));
    document.getElementById('galleryMotion').hidden=browsing||reduceMotion;
    browseButton.textContent = browsing ? 'Show moving artwork' : 'Show artwork grid';
    galleryHint.textContent = browsing ? 'Every piece, in one place. Select any artwork to enlarge it.' : 'A moving collection. Open any piece, or explore the grid.';
    if (hasST) ScrollTrigger.refresh();
  }
  if (collage && browseButton) {
    browseButton.addEventListener('click', function () {
      browseGallery(!collage.classList.contains('is-browsing'));
    });
    if (reduceMotion) {
      browseGallery(true);
      browseButton.hidden = true;
    }
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
        container === menu ? document.querySelectorAll('#nav a, #nav button, #mobileMenu a') : container.querySelectorAll(FOCUSABLE),
        function (el) { return !el.closest('[inert]') && getComputedStyle(el).visibility !== 'hidden' && (el.offsetParent !== null || el === document.activeElement); }
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
      lbLastFocus = document.activeElement;
      lockOverlay(lightbox);
      document.addEventListener('keydown', lbTrap);
      focusOverlay(lightbox, lightboxClose);
    });
    function closeLightbox() {
      if (!lightbox.classList.contains('is-open')) return;
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      unlockOverlay(lightbox);
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
      var readingLine = scroll.getBoundingClientRect().top + Math.min(240, scroll.clientHeight * 0.35);
      var images = scroll.querySelectorAll('.cv-stage img');
      var cur = total;
      for (var i = 0; i < images.length; i++) {
        if (images[i].getBoundingClientRect().bottom > readingLine) { cur = i + 1; break; }
      }
      if (max > 0 && scroll.scrollTop >= max - 2) cur = total;
      progressEl.textContent = pad(cur) + ' / ' + pad(total);
    }
    function openCase(slug) {
      var c = DATA[slug];
      if (!c || !c.pages || !c.pages.length) return false;
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
      lockOverlay(cv);
      scroll.scrollTop = 0;
      updateProgress();
      document.addEventListener('keydown', cvTrap);
      focusOverlay(cv, closeEl);
      return true;
    }
    function closeCase() {
      cv.classList.remove('is-open');
      cv.setAttribute('aria-hidden', 'true');
      unlockOverlay(cv);
      document.removeEventListener('keydown', cvTrap);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    scroll.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', function () {
      if (cv.classList.contains('is-open')) updateProgress();
    });
    closeEl.addEventListener('click', closeCase);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && cv.classList.contains('is-open')) closeCase();
    });
    document.querySelectorAll('[data-open-case]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var c = DATA[link.getAttribute('data-open-case')];
        if (!c || !c.pages || !c.pages.length) return;
        e.preventDefault();
        openCase(link.getAttribute('data-open-case'));
      });
    });
    document.querySelectorAll('.card[data-case]').forEach(function (card) {
      var entry = DATA[card.getAttribute('data-case')];
      if (entry && entry.pages && entry.pages.length) card.setAttribute('aria-haspopup', 'dialog');
      card.addEventListener('click', function (e) {
        var slug = card.getAttribute('data-case');
        if (DATA[slug] && DATA[slug].pages && DATA[slug].pages.length) { e.preventDefault(); openCase(slug); }
        // no data for slug -> fall through to href (PDF) as graceful fallback
      });
    });
  })();

  /* ---------- Independent searches for design and built products ---------- */
  (function () {
    function setup(panelID, searchID, clearID, resultsID, emptyID, label) {
      var panel=document.getElementById(panelID),search=document.getElementById(searchID);
      var clear=document.getElementById(clearID),results=document.getElementById(resultsID),empty=document.getElementById(emptyID);
      function filterProjects() {
        var query=search.value.trim().toLocaleLowerCase(),cards=panel.querySelectorAll('.card,.play-card'),visible=0;
        cards.forEach(function(card){card.hidden=!card.textContent.toLocaleLowerCase().includes(query);if(!card.hidden)visible++;});
        clear.hidden=!search.value;empty.hidden=visible>0;
        results.textContent=visible+' of '+cards.length+' '+label;
        document.dispatchEvent(new CustomEvent('portfolio:projects-filtered',{detail:{panel:panelID}}));
        if(hasST)ScrollTrigger.refresh();
      }
      search.addEventListener('input',filterProjects);
      clear.addEventListener('click',function(){search.value='';filterProjects();search.focus();});
      filterProjects();
    }
    setup('cards','projectSearch','projectSearchClear','projectResults','projectEmpty','design case studies');
    setup('playGrid','builtSearch','builtSearchClear','builtResults','builtEmpty','built products');

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
