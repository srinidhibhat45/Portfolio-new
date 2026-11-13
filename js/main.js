/* ============================================================
   SRINIDHI BHAT — Portfolio interactions
   GSAP + ScrollTrigger (progressive enhancement)
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
    var STORIES = window.CASE_STUDIES || {};

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
      window.CASE_DATA[w.slug] = Object.assign({}, w, PAGES[w.slug], { story: STORIES[w.slug] });
    });
    (SITE.vibe || []).forEach(function (v) {
      if (v.caseSlug && STORIES[v.caseSlug]) window.CASE_DATA[v.caseSlug] = {
        title: v.name, tags: 'Product design and build', story: STORIES[v.caseSlug]
      };
    });

    // One card for every project: a 3:2 cover, a status pill, the name and one line.
    // The tags are kept in the card for search but are not drawn.
    // Covers live at assets/covers/<slug>.webp (1280w) with a <slug>-800.webp for small screens.
    function coverCard(p) {
      var cover = 'assets/covers/' + p.slug;
      return '<a class="cover-card" href="' + esc(p.href) + '"' +
        (p.caseSlug ? ' data-case="' + esc(p.caseSlug) + '"' : ' target="_blank" rel="noopener"') + '>' +
        '<div class="cover-media"><img src="' + esc(cover) + '.webp" srcset="' + esc(cover) + '-800.webp 800w, ' + esc(cover) + '.webp 1280w"' +
          ' sizes="(min-width: 1100px) 30vw, 46vw"' +
          ' alt="' + esc(p.name) + ' cover artwork" width="1280" height="853" loading="lazy" decoding="async">' +
          (p.pill ? '<span class="cover-pill' + (p.pillTone ? ' is-' + p.pillTone : '') + '">' + esc(p.pill) + '</span>' : '') + '</div>' +
        '<div class="cover-body">' +
          '<div class="cover-head"><h3>' + esc(p.name) + '</h3><span class="cover-arrow" aria-hidden="true">↗</span></div>' +
          '<p class="cover-blurb">' + esc(p.blurb) + '</p>' +
          '<ul class="cover-tags">' + p.tags.map(function (tag) { return '<li>' + esc(tag) + '</li>'; }).join('') + '</ul>' +
          '<span class="cover-cta">' + esc(p.cta) + '</span>' +
        '</div>' +
      '</a>';
    }

    var cardsEl = document.getElementById('cards');
    if (cardsEl && SITE.work && SITE.work.length) {
      cardsEl.innerHTML = SITE.work.map(function (w) {
        var tags = String(w.tags).split(' · ');
        return coverCard({
          slug: w.slug, caseSlug: w.slug, name: w.title, blurb: w.blurb,
          href: STORIES[w.slug] ? 'case-studies/' + w.slug + '.html' : w.pdf,
          pill: tags[0], tags: tags.slice(1), cta: 'View case study'
        });
      }).join('');
    }

    var vibeEl = document.getElementById('playGrid');
    if (vibeEl && SITE.vibe && SITE.vibe.length) {
      /* The owner's order: the three starred products first, then Matinee and Hued, then the rest. */
      var priority = ['Arkitype', 'Halo', 'PureEQ', 'Matinee', 'Hued', 'Forma', 'Binnder', 'OhCaptain', 'Hidden Identity Chess', '5 Dead', 'Alibi', 'AppleCider', 'PlanIt', 'DeckForge', 'Earthlog', 'HexChess', 'DashF1', 'Vansh Vriksha'];
      var products = SITE.vibe.slice().sort(function (a, b) {
        var ai = priority.indexOf(a.name), bi = priority.indexOf(b.name);
        return (ai < 0 ? 100 : ai) - (bi < 0 ? 100 : bi);
      });
      vibeEl.innerHTML = products.map(function (v) {
        var starred = ['Arkitype', 'Halo', 'PureEQ'].includes(v.name);
        var hasStory = v.caseSlug && STORIES[v.caseSlug];
        return coverCard({
          slug: v.caseSlug, caseSlug: hasStory ? v.caseSlug : '', name: v.name, blurb: v.desc,
          href: hasStory ? 'case-studies/' + v.caseSlug + '.html' : v.href,
          pill: v.status === 'building' ? 'In development' : 'Live', pillTone: v.status === 'building' ? 'building' : 'live',
          tags: (starred ? ['✦ Starred'] : []).concat(v.stack || []),
          cta: hasStory ? 'Read the case study' : v.cta
        });
      }).join('');
    }

    var rowEls = document.querySelectorAll('.collage-row');
    if (rowEls.length && SITE.posters && SITE.posters.length) {
      var sets = Array.prototype.map.call(rowEls, function (row) { return row.querySelector('.collage-set'); });
      sets.forEach(function (set) { if (set) set.innerHTML = ''; });
      var counts = sets.map(function () { return 0; });
      SITE.posters.forEach(function (p, posterIndex) {
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
          '<button class="gi" type="button" aria-label="View ' + esc(p.alt || 'Artwork') + ' ' + (posterIndex + 1) + ' full size">' +
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

  if (hasST) {
    gsap.registerPlugin(ScrollTrigger);
    // Mobile in-app browsers (Instagram, etc.) resize the viewport as their
    // chrome collapses/expands mid-scroll; without this, ScrollTrigger's
    // auto-refresh on that resize desyncs scrub positions (e.g. hero
    // parallax stuck offset after scrolling down then back up).
    ScrollTrigger.config({ ignoreMobileResize: true });
  }

  /* Keep overlays isolated for keyboard, touch and assistive technology. */
  document.addEventListener('portfolio:before-dialog', function () { closeMenu(); });
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
  }
  function unlockOverlay(overlay) {
    if (activeOverlay !== overlay) return;
    overlay.inert = true;
    inertSiblings.forEach(function (saved) { saved.el.inert = saved.inert; });
    inertSiblings = [];
    activeOverlay = null;
    document.body.style.overflow = previousOverflow;
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
      window.scrollTo({
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
    /* The browser bar matches the nav: Kaavi red by day, a shade deeper at night. */
    var COLORS = { light: '#842b22', dark: '#6a211a' };
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
    galleryHint.textContent = 'Select an artwork to view it full size.';
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
  var FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, summary, [tabindex]:not([tabindex="-1"])';
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
      if (c.story && window.CaseStudyRenderer) {
        scroll.innerHTML = window.CaseStudyRenderer.render(c.story);
        return;
      }
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
      fillEl.style.transform = 'scaleX(' + frac.toFixed(4) + ')';
      if (scroll.querySelector('.case-study')) {
        progressEl.textContent = Math.round(frac * 100) + '% read';
        return;
      }
      var readingLine = scroll.getBoundingClientRect().top + Math.min(240, scroll.clientHeight * 0.35);
      var images = scroll.querySelectorAll('.cv-stage img');
      var cur = total;
      for (var i = 0; i < images.length; i++) {
        if (images[i].getBoundingClientRect().bottom > readingLine) { cur = i + 1; break; }
      }
      if (max > 0 && scroll.scrollTop >= max - 2) cur = total;
      progressEl.textContent = pad(cur) + ' / ' + pad(total);
    }
    /* An open case study is a step in the browser's history (#case=<slug>), so the Back button,
       a mouse's back button, a back swipe or Alt+Left close it instead of leaving the site.
       `pushed` is true while the current entry is a case entry with the page itself behind it. */
    var HASH = '#case=', pushed = false, openedAt = 0;
    function viewable(slug) { var c = DATA[slug]; return !!(c && (c.story || c.pages && c.pages.length)); }
    function caseInUrl() {
      var h = location.hash;
      if (h.indexOf(HASH) !== 0) return '';
      try { return decodeURIComponent(h.slice(HASH.length)); } catch (err) { return ''; }
    }
    function pageUrl() { return location.pathname + location.search; }
    function caseUrl(slug) { return pageUrl() + HASH + encodeURIComponent(slug); }
    function ownEntry() { return !!(history.state && history.state.portfolioCase); }

    function openCase(slug, fromHistory) {
      var c = DATA[slug];
      if (!viewable(slug)) return false;
      var already = cv.classList.contains('is-open');
      // Record the step before the page is locked, so the page's own entry keeps its real scroll position.
      if (!fromHistory) {
        try {
          if (already) history.replaceState({ portfolioCase: slug }, '', caseUrl(slug));
          else { history.pushState({ portfolioCase: slug }, '', caseUrl(slug)); pushed = true; }
        } catch (err) { /* sandboxed frames may refuse; the viewer still opens */ }
      }
      titleEl.textContent = c.title;
      tagsEl.textContent = c.tags;
      // A second-edition study links to its own original deck (or nothing); the collection PDF still holds the older text.
      var rebuilt = c.story && c.story.v2;
      pdfEl.hidden = !!(rebuilt && !c.story.originalPdf);
      pdfEl.href = rebuilt ? (c.story.originalPdf || '#') : c.story ? window.CaseStudyRenderer.collectionUrl(c.story) : c.pdf;
      pdfEl.textContent = rebuilt ? 'Original deck ↗' : c.story ? 'Collection PDF ↗' : 'PDF ↓';
      if (protoEl) {
        var destination = c.story && c.story.liveUrl || c.prototypeUrl;
        if (destination) { protoEl.href = destination; protoEl.textContent = c.story && c.story.liveUrl ? (c.story.productHeaderLabel || 'Explore product') + ' ↗' : 'View prototype ↗'; protoEl.hidden = false; }
        else { protoEl.hidden = true; protoEl.removeAttribute('href'); }
      }
      total = c.pages ? c.pages.length : 1;
      build(c);
      if (!already) {
        // Opening one case from inside another keeps the first opener to return focus to.
        lastFocus = document.activeElement;
        openedAt = window.scrollY;
        cv.classList.add('is-open');
        cv.setAttribute('aria-hidden', 'false');
        lockOverlay(cv);
        document.addEventListener('keydown', cvTrap);
      }
      scroll.scrollTop = 0;
      updateProgress();
      focusOverlay(cv, closeEl);
      return true;
    }
    // fromHistory: the browser has already stepped back, so only the viewer needs closing.
    function closeCase(fromHistory) {
      if (!cv.classList.contains('is-open')) return;
      cv.classList.remove('is-open');
      cv.setAttribute('aria-hidden', 'true');
      unlockOverlay(cv);
      document.removeEventListener('keydown', cvTrap);
      if (!fromHistory) {
        try {
          // Step back over our own entry, so history does not pile up; otherwise just drop the hash.
          if (pushed && ownEntry()) history.back();
          else if (caseInUrl()) history.replaceState(null, '', pageUrl());
        } catch (err) { /* ignore */ }
      }
      pushed = false;
      // The page never scrolls while the viewer is open; make sure it is exactly where the visitor left it.
      if (Math.abs(window.scrollY - openedAt) > 1) window.scrollTo({ top: openedAt, behavior: 'instant' });
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }
    window.addEventListener('popstate', function (e) {
      var slug = e.state && e.state.portfolioCase || caseInUrl();
      if (slug && viewable(slug)) {
        // Forward onto a case again: reopen it. Its page entry is still behind it.
        pushed = true;
        openCase(slug, true);
        return;
      }
      if (!cv.classList.contains('is-open')) { pushed = false; return; }
      // A jump link inside the case (they normally stay off the history) is not a way out.
      var id = location.hash.slice(1), inside = id && document.getElementById(id);
      if (inside && cv.contains(inside)) return;
      closeCase(true);
      // Some browsers restore the scroll position a frame later; hold it where it was.
      var y = openedAt;
      requestAnimationFrame(function () { if (!cv.classList.contains('is-open') && Math.abs(window.scrollY - y) > 1) window.scrollTo({ top: y, behavior: 'instant' }); });
    });
    scroll.addEventListener('scroll', updateProgress, { passive: true });
    scroll.addEventListener('click', function (e) {
      var link = e.target.closest('.cs-contents a, .cs-jump');
      if (!link || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      var target = document.getElementById(link.getAttribute('href').slice(1));
      if (target && scroll.contains(target)) {
        e.preventDefault();
        var readingOffset = 28;
        scroll.scrollTo({top: target.getBoundingClientRect().top - scroll.getBoundingClientRect().top + scroll.scrollTop - readingOffset, behavior: reduceMotion ? 'instant' : 'smooth'});
        if (!target.hasAttribute('tabindex')) {
          target.setAttribute('tabindex', '-1');
          target.addEventListener('blur', function () { target.removeAttribute('tabindex'); }, { once: true });
        }
        target.focus({preventScroll:true});
      }
    });
    window.addEventListener('resize', function () {
      if (cv.classList.contains('is-open')) updateProgress();
    });
    closeEl.addEventListener('click', function () { closeCase(); });
    var surprise = document.getElementById('surpriseProject'), lastDiscovery = '';
    if (surprise) {
      surprise.setAttribute('aria-haspopup', 'dialog');
      surprise.setAttribute('aria-controls', 'caseViewer');
      surprise.addEventListener('click', function (event) {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
        var slugs = Object.keys(DATA).filter(function (slug) { return DATA[slug].story && slug !== lastDiscovery; });
        if (!slugs.length) return;
        var slug = slugs[Math.floor(Math.random() * slugs.length)];
        if (openCase(slug)) { event.preventDefault(); lastDiscovery = slug; }
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && cv.classList.contains('is-open')) closeCase();
    });
    document.querySelectorAll('[data-open-case]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var c = DATA[link.getAttribute('data-open-case')];
        if (!c || !(c.story || c.pages && c.pages.length) || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        openCase(link.getAttribute('data-open-case'));
      });
    });
    document.querySelectorAll('.cover-card[data-case]').forEach(function (card) {
      var entry = DATA[card.getAttribute('data-case')];
      if (entry && (entry.story || entry.pages && entry.pages.length)) card.setAttribute('aria-haspopup', 'dialog');
      card.addEventListener('click', function (e) {
        var slug = card.getAttribute('data-case');
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;
        if (DATA[slug] && (DATA[slug].story || DATA[slug].pages && DATA[slug].pages.length)) { e.preventDefault(); openCase(slug); }
        // no data for slug -> fall through to href (PDF) as graceful fallback
      });
    });

    // A shared or reloaded link with #case=<slug> opens that case study. A fresh link gets the page put
    // behind it, so Back closes the case instead of leaving; a reload keeps the entries it already had.
    var linked = caseInUrl();
    if (linked && viewable(linked)) {
      try {
        if (ownEntry()) pushed = true;
        else { history.replaceState(null, '', pageUrl()); history.pushState({ portfolioCase: linked }, '', caseUrl(linked)); pushed = true; }
      } catch (err) { /* ignore */ }
      openCase(linked, true);
    } else if (linked) {
      try { history.replaceState(null, '', pageUrl()); } catch (err) { /* ignore */ }
    }
  })();

  /* ---------- Independent searches for design and built products ---------- */
  (function () {
    function setup(panelID, searchID, clearID, resultsID, emptyID, label) {
      var panel=document.getElementById(panelID),search=document.getElementById(searchID);
      var clear=document.getElementById(clearID),results=document.getElementById(resultsID),empty=document.getElementById(emptyID);
      function filterProjects() {
        var query=search.value.trim().toLocaleLowerCase(),cards=panel.querySelectorAll('.cover-card'),visible=0;
        cards.forEach(function(card){card.hidden=!card.textContent.toLocaleLowerCase().includes(query);if(!card.hidden)visible++;});
        clear.hidden=!search.value;empty.hidden=visible>0;
        results.textContent=visible+' of '+cards.length+' '+label;
        // A new search starts from the beginning of the rail.
        panel.scrollLeft=0;panel.dispatchEvent(new Event('scroll'));
        if(hasST)ScrollTrigger.refresh();
      }
      search.addEventListener('input',filterProjects);
      clear.addEventListener('click',function(){search.value='';filterProjects();search.focus();});
      filterProjects();
    }
    setup('cards','projectSearch','projectSearchClear','projectResults','projectEmpty','design case studies');
    setup('playGrid','builtSearch','builtSearchClear','builtResults','builtEmpty','built products');
    // Opening a search puts the cursor straight in its box.
    document.querySelectorAll('details.project-search').forEach(function (details) {
      details.addEventListener('toggle', function () {
        var input = details.querySelector('input');
        if (details.open && input) input.focus({preventScroll: true});
      });
    });

    // The arrows step a rail one view at a time; touch and trackpads scroll it directly.
    document.querySelectorAll('[data-rail]').forEach(function (group) {
      var rail=document.getElementById(group.getAttribute('data-rail'));
      var previous=group.querySelector('[data-rail-dir="-1"]'),next=group.querySelector('[data-rail-dir="1"]');
      function update() {
        var max=rail.scrollWidth-rail.clientWidth;
        previous.disabled=rail.scrollLeft<=2;next.disabled=rail.scrollLeft>=max-2;
        group.hidden=max<=2;
      }
      function step(direction) { rail.scrollBy({left:direction*rail.clientWidth*.85,behavior:reduceMotion?'auto':'smooth'}); }
      previous.addEventListener('click',function(){step(-1);});
      next.addEventListener('click',function(){step(1);});
      rail.addEventListener('scroll',update,{passive:true});
      window.addEventListener('resize',update);
      update();
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
