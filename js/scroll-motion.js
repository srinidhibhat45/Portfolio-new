/* One quiet entrance per element. Native motion works even without GSAP. */
(function () {
  'use strict';
  var preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (preference.matches || /[?&]static/.test(location.search) ||
      !('IntersectionObserver' in window) || !Element.prototype.animate) return;

  var items = new Map(), running = new Map();
  var ease = 'cubic-bezier(.16,1,.3,1)';
  var mobile = window.matchMedia('(max-width: 600px)').matches;

  function register(element, delay, type) {
    if (!element || items.has(element)) return;
    // Never conceal content already passed, including an initial deep link.
    if (element.getBoundingClientRect().bottom <= 0) return;
    items.set(element, {delay: delay || 0, type: type || 'text'});
  }
  function select(selector, delay, type) {
    document.querySelectorAll(selector).forEach(function (element) {
      register(element, delay, type);
    });
  }

  // Independent heading and supporting copy, then the collection underneath.
  document.querySelectorAll('main .section-head, .play-heading').forEach(function (head) {
    Array.from(head.children).forEach(function (element, index) {
      register(element, index * 100, 'heading');
    });
  });
  select('.project-tools, .gallery-tools', 100);
  select('#cards, #playGrid, .board-frame', 140, 'surface');
  select('.now-building, .about-portrait-wrap, .stats, .brain-navigation, .brain-map-head, .service-foot', 70);
  select('.brain-canvas', 90, 'surface');
  select('.brain-map-foot, .brain-detail', 100);
  document.querySelectorAll('.xp-row, .service-offering, .test-item, .collage-row').forEach(function (element) {
    var index = Array.from(element.parentElement.children).indexOf(element);
    register(element, Math.min(index % 3 * 75, 150), 'surface');
  });
  select('.about-statement, .writing-copy', 0, 'heading');
  select('.writing-notebook', 100, 'surface');
  select('.contact-title', 50, 'heading');
  select('.contact-direct', 120, 'heading');
  select('.brief-details', 170);
  select('main [data-reveal]');

  // A parent entrance already carries its children; avoid doubled movement.
  items.forEach(function (_, element) {
    for (var parent = element.parentElement; parent; parent = parent.parentElement) {
      if (items.has(parent)) { items.delete(element); break; }
    }
  });
  items.forEach(function (settings, element) {
    var distance = settings.type === 'surface' ? 34 : settings.type === 'heading' ? 26 : 18;
    settings.distance = mobile ? Math.round(distance * .65) : distance;
    element.style.setProperty('--arrival-distance', settings.distance + 'px');
    element.classList.add('scroll-pending');
  });

  function finish(element) {
    if (observer) observer.unobserve(element);
    var animation = running.get(element);
    if (animation) { animation.cancel(); running.delete(element); }
    element.classList.remove('scroll-pending', 'scroll-arriving');
    element.classList.add('scroll-seen');
    element.style.removeProperty('--arrival-distance');
  }
  function enter(element) {
    if (!element.classList.contains('scroll-pending')) return;
    observer.unobserve(element);
    var settings = items.get(element);
    if (preference.matches || element.getBoundingClientRect().bottom <= 0) { finish(element); return; }
    element.classList.replace('scroll-pending', 'scroll-arriving');
    var animation = element.animate([
      {opacity: 0, translate: '0 ' + settings.distance + 'px'},
      {opacity: 1, translate: '0 0'}
    ], {duration: mobile ? 760 : 1000, delay: settings.delay, easing: ease, fill: 'both'});
    running.set(element, animation);
    animation.onfinish = function () { finish(element); };

    // Details settle after their frame. Off-rail cards remain immediately usable.
    if (element.id === 'cards' || element.id === 'playGrid') {
      Array.from(element.children).slice(0, 3).forEach(function (card, index) {
        var detail = card.querySelector('.card-body, .play-card-head');
        if (!detail) return;
        var motion = detail.animate([
          {opacity: .25, translate: '0 12px'}, {opacity: 1, translate: '0 0'}
        ], {duration: 700, delay: 190 + index * 85, easing: ease});
        running.set(detail, motion);
        motion.onfinish = function () { running.delete(detail); };
      });
    }
  }
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting || entry.boundingClientRect.bottom <= 0) enter(entry.target);
    });
  }, {rootMargin: '0px 0px -5% 0px', threshold: 0});
  items.forEach(function (_, element) { observer.observe(element); });

  // Keyboard users see the control as soon as it receives focus.
  document.addEventListener('focusin', function (event) {
    items.forEach(function (_, element) {
      if (element.contains(event.target)) finish(element);
    });
    running.forEach(function (_, element) {
      if (element.contains(event.target)) finish(element);
    });
  });
  function revealAll() {
    items.forEach(function (_, element) { finish(element); });
    running.forEach(function (_, element) { finish(element); });
    observer.disconnect();
  }
  preference.addEventListener('change', function (event) { if (event.matches) revealAll(); });
  window.addEventListener('beforeprint', revealAll);
  window.addEventListener('pageshow', function (event) { if (event.persisted) revealAll(); });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) running.forEach(function (_, element) { finish(element); });
  });
})();
