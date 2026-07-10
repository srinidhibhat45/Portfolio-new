/* ============================================================
   SRINIDHI BHAT — Portfolio interactions
   GSAP + ScrollTrigger + Lenis (all progressive enhancements)
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
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    if (hasST) lenis.on('scroll', ScrollTrigger.update);
  }

  // anchor links work with Lenis
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

  /* ---------- Split text into words (for reveals) ----------
     Wraps each word in .wm > .w while preserving <br>, <em> etc. */
  function wrapWords(el) {
    Array.prototype.slice.call(el.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        var parts = node.textContent.split(/(\s+)/).filter(Boolean);
        var frag = document.createDocumentFragment();
        parts.forEach(function (part) {
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(' '));
            return;
          }
          var wm = document.createElement('span');
          wm.className = 'wm';
          var w = document.createElement('span');
          w.className = 'w';
          w.textContent = part;
          wm.appendChild(w);
          frag.appendChild(wm);
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
  // failsafe: never trap the visitor behind the preloader
  // (background tabs suspend rAF, which pauses GSAP timelines)
  setTimeout(killPreloader, 4500);

  if (preloader && hasGSAP && !reduceMotion && !document.hidden) {
    document.body.style.overflow = 'hidden';
    var count = { v: 0 };
    var countEl = document.getElementById('preloaderCount');
    var tl = gsap.timeline({ onComplete: killPreloader });
    tl.to('.pl-letter', {
      y: 0,
      duration: 0.9,
      stagger: 0.055,
      ease: 'expo.out'
    }, 0);
    tl.to(count, {
      v: 100,
      duration: 1.6,
      ease: 'power2.inOut',
      onUpdate: function () {
        if (countEl) countEl.textContent = Math.round(count.v);
      }
    }, 0);
    tl.to('.pl-letter', {
      y: '-110%',
      duration: 0.7,
      stagger: 0.04,
      ease: 'expo.in'
    }, '+=0.15');
    tl.to(preloader, {
      clipPath: 'inset(0 0 100% 0)',
      duration: 0.85,
      ease: 'expo.inOut'
    }, '-=0.35');
  } else {
    killPreloader();
  }

  /* ---------- Hero intro ---------- */
  function heroIntro() {
    if (!hasGSAP || reduceMotion || document.hidden) return;
    var tl = gsap.timeline();
    tl.from('.hero-line .hw', {
      yPercent: 115,
      duration: 1.2,
      stagger: 0.12,
      ease: 'expo.out'
    }, 0.05);
    tl.from('.hero-portrait', {
      scale: 0.7,
      opacity: 0,
      duration: 1.3,
      ease: 'expo.out'
    }, 0.3);
    tl.from('.hero-meta, .hero-badge, .hero-scroll, .nav', {
      opacity: 0,
      y: 24,
      duration: 0.9,
      stagger: 0.08,
      ease: 'power3.out',
      clearProps: 'all'
    }, 0.75);
  }

  /* ---------- Custom cursor ---------- */
  var cursor = document.getElementById('cursor');
  var cursorLabel = document.getElementById('cursorLabel');
  if (cursor && !isTouch && hasGSAP) {
    var cx = gsap.quickTo(cursor, 'x', { duration: 0.18, ease: 'power3.out' });
    var cy = gsap.quickTo(cursor, 'y', { duration: 0.18, ease: 'power3.out' });
    window.addEventListener('mousemove', function (e) {
      cursor.style.opacity = '1';
      cx(e.clientX);
      cy(e.clientY);
    });
    document.querySelectorAll('[data-cursor="hover"], .nav-links a, .contact-links a').forEach(function (el) {
      el.addEventListener('mouseenter', function () { cursor.classList.add('is-hover'); });
      el.addEventListener('mouseleave', function () { cursor.classList.remove('is-hover'); });
    });
    document.querySelectorAll('.work-row').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        cursor.classList.add('is-view');
        cursorLabel.textContent = 'View ↗';
      });
      el.addEventListener('mouseleave', function () {
        cursor.classList.remove('is-view');
        cursorLabel.textContent = '';
      });
    });
    document.querySelectorAll('.craft-item').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        cursor.classList.add('is-view');
        cursorLabel.textContent = 'Open';
      });
      el.addEventListener('mouseleave', function () {
        cursor.classList.remove('is-view');
        cursorLabel.textContent = '';
      });
    });
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
    // word-by-word titles
    document.querySelectorAll('[data-split]').forEach(function (el) {
      gsap.from(el.querySelectorAll('.w'), {
        yPercent: 115,
        duration: 0.9,
        stagger: 0.04,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 85%' }
      });
    });
    // generic fade-ups
    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      gsap.fromTo(el,
        { opacity: 0, y: 34 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%' },
          onComplete: function () { el.classList.add('is-in'); }
        });
    });
    // work rows cascade
    gsap.utils.toArray('.work-row').forEach(function (row) {
      gsap.from(row, {
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: row, start: 'top 92%' }
      });
    });
    // stats count-up
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      var obj = { v: 0 };
      gsap.to(obj, {
        v: target,
        duration: 1.6,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%' },
        onUpdate: function () { el.textContent = Math.round(obj.v); }
      });
    });
    // hero parallax on scroll (desktop overlap layout only)
    if (!isMobile) {
      gsap.to('.hero-portrait', {
        yPercent: 18,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
      });
      gsap.to('.hero-line-1 .hw', {
        xPercent: -6,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
      });
      gsap.to('.hero-line-2 .hw', {
        xPercent: 6,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
      });
    }
  } else {
    // no motion: make sure everything is visible and counters show final values
    document.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('is-in'); });
    document.querySelectorAll('[data-count]').forEach(function (el) {
      el.textContent = el.getAttribute('data-count');
    });
  }

  /* ---------- Work: floating preview follows cursor ---------- */
  var workFloat = document.getElementById('workFloat');
  var workFloatImg = document.getElementById('workFloatImg');
  if (workFloat && !isTouch && hasGSAP) {
    var fx = gsap.quickTo(workFloat, 'x', { duration: 0.35, ease: 'power3.out' });
    var fy = gsap.quickTo(workFloat, 'y', { duration: 0.35, ease: 'power3.out' });
    var workList = document.getElementById('workList');
    workList.addEventListener('mousemove', function (e) {
      fx(e.clientX + 28);
      fy(e.clientY - (workFloat.offsetHeight / 2));
    });
    document.querySelectorAll('.work-row').forEach(function (row) {
      row.addEventListener('mouseenter', function () {
        workFloatImg.src = row.getAttribute('data-thumb');
        gsap.to(workFloat, { opacity: 1, scale: 1, duration: 0.4, ease: 'power3.out' });
      });
      row.addEventListener('mouseleave', function () {
        gsap.to(workFloat, { opacity: 0, scale: 0.85, duration: 0.3, ease: 'power3.out' });
      });
    });
  }

  /* ---------- Craft: horizontal scroll (desktop) ---------- */
  var craftTrack = document.getElementById('craftTrack');
  var craftViewport = document.getElementById('craftViewport');
  var craftPinned = craftTrack && hasST && !reduceMotion && !isMobile;
  if (craftViewport && !craftPinned) {
    // no pinned scrub available: fall back to native sideways scroll
    craftViewport.style.overflowX = 'auto';
  }
  if (craftPinned) {
    var getDistance = function () {
      return Math.max(0, craftTrack.scrollWidth - window.innerWidth);
    };
    gsap.to(craftTrack, {
      x: function () { return -getDistance(); },
      ease: 'none',
      scrollTrigger: {
        trigger: '.craft-viewport',
        start: 'top top+=90',
        end: function () { return '+=' + getDistance(); },
        pin: '.craft',
        scrub: 1,
        invalidateOnRefresh: true
      }
    });
  }

  /* ---------- Lightbox for craft items ---------- */
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var lightboxClose = document.getElementById('lightboxClose');
  if (lightbox) {
    document.querySelectorAll('.craft-item').forEach(function (item) {
      item.addEventListener('click', function () {
        var img = item.querySelector('img');
        lightboxImg.src = img.src;
        lightbox.classList.add('is-open');
        lightbox.setAttribute('aria-hidden', 'false');
        if (lenis) lenis.stop();
      });
    });
    function closeLightbox() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      if (lenis) lenis.start();
    }
    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeLightbox();
    });
  }

  /* ---------- Magnetic elements ---------- */
  if (!isTouch && hasGSAP && !reduceMotion) {
    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      var mx = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out' });
      var my = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out' });
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        mx((e.clientX - (r.left + r.width / 2)) * 0.25);
        my((e.clientY - (r.top + r.height / 2)) * 0.25);
      });
      el.addEventListener('mouseleave', function () { mx(0); my(0); });
    });
  }

  /* ---------- Local time (Goa, IST) ---------- */
  var timeEl = document.getElementById('localTime');
  function tickTime() {
    if (!timeEl) return;
    try {
      timeEl.textContent = new Intl.DateTimeFormat('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Kolkata'
      }).format(new Date());
    } catch (e) { /* ignore */ }
  }
  tickTime();
  setInterval(tickTime, 30000);
})();
