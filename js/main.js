/* ============================================================
   SRINIDHI BHAT — Portfolio interactions
   GSAP + ScrollTrigger + Lenis (progressive enhancement)
   ============================================================ */
(function () {
  'use strict';

  var hasGSAP = typeof gsap !== 'undefined';
  var hasST = hasGSAP && typeof ScrollTrigger !== 'undefined';
  var staticMode = /[?&]static/.test(location.search);
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches || staticMode;
  var isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  var isMobile = window.matchMedia('(max-width: 900px)').matches;

  if (hasST) gsap.registerPlugin(ScrollTrigger);

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
    });
  });

  /* ---------- Word-wrap for split reveals (preserves <br>, <em>) ---------- */
  function wrapWords(el) {
    Array.prototype.slice.call(el.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        var parts = node.textContent.split(/(\s+)/).filter(Boolean);
        var frag = document.createDocumentFragment();
        parts.forEach(function (part) {
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          var wm = document.createElement('span'); wm.className = 'wm';
          wm.style.display = 'inline-block'; wm.style.overflow = 'hidden'; wm.style.verticalAlign = 'top';
          var w = document.createElement('span'); w.className = 'w';
          w.style.display = 'inline-block'; w.textContent = part;
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
    tl.from('.hero-echo', { xPercent: -6, opacity: 0, duration: 1.2, ease: 'expo.out' }, 0.5);
    tl.from('.hero-bio, .hero-seal, .hero-foot, .nav', {
      opacity: 0, y: 22, duration: 0.9, stagger: 0.08, ease: 'power3.out', clearProps: 'opacity,transform'
    }, 0.7);
  }

  /* ---------- Custom cursor ---------- */
  var cursor = document.getElementById('cursor');
  var cursorLabel = document.getElementById('cursorLabel');
  if (cursor && !isTouch && hasGSAP) {
    var cx = gsap.quickTo(cursor, 'x', { duration: 0.18, ease: 'power3.out' });
    var cy = gsap.quickTo(cursor, 'y', { duration: 0.18, ease: 'power3.out' });
    window.addEventListener('mousemove', function (e) { cursor.style.opacity = '1'; cx(e.clientX); cy(e.clientY); });
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
      gsap.to('.hero-bgword', { xPercent: -8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    }
  } else {
    document.querySelectorAll('[data-reveal]').forEach(function (el) { el.style.opacity = 1; });
    document.querySelectorAll('[data-count]').forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
  }

  /* ---------- Gallery collage: seamless auto-scroll rows ---------- */
  document.querySelectorAll('.collage-row').forEach(function (row) {
    var set = row.querySelector('.collage-set');
    if (!set) return;
    row.style.display = 'flex';
    var lane = document.createElement('div');
    lane.style.display = 'flex';
    lane.style.gap = getComputedStyle(set).gap;
    lane.style.willChange = 'transform';
    row.appendChild(lane);
    lane.appendChild(set);
    lane.appendChild(set.cloneNode(true));

    var dir = parseFloat(row.getAttribute('data-dir')) || 1;   // 1 = left, -1 = right
    var pxPerSec = 60; // base speed
    var speedAttr = parseFloat(row.getAttribute('data-speed'));
    if (speedAttr) pxPerSec = 2400 / speedAttr;

    var setWidth = 0;
    function measure() {
      var gap = parseFloat(getComputedStyle(set).gap) || 0;
      setWidth = set.scrollWidth + gap;
    }
    measure();
    window.addEventListener('resize', measure);

    var x = dir > 0 ? 0 : -setWidth;
    var last = performance.now();
    var paused = false;
    row.addEventListener('mouseenter', function () { paused = true; });
    row.addEventListener('mouseleave', function () { paused = false; });

    function tick(now) {
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!paused && !reduceMotion && setWidth > 0) {
        x -= pxPerSec * dt * dir;
        if (x <= -setWidth) x += setWidth;
        if (x > 0) x -= setWidth;
        lane.style.transform = 'translateX(' + x + 'px)';
      }
      requestAnimationFrame(tick);
    }
    if (!reduceMotion) requestAnimationFrame(tick);
  });

  /* ---------- Lightbox ---------- */
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var lightboxClose = document.getElementById('lightboxClose');
  if (lightbox) {
    document.addEventListener('click', function (e) {
      var fig = e.target.closest && e.target.closest('.gi');
      if (!fig) return;
      var img = fig.querySelector('img');
      if (!img) return;
      lightboxImg.src = img.currentSrc || img.src;
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      if (lenis) lenis.stop();
    });
    function closeLightbox() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      if (lenis) lenis.start();
    }
    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLightbox(); });
  }

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
