/* Decorative motion never changes a hit target or carries portfolio content. */
(function () {
  'use strict';
  var preference = matchMedia('(prefers-reduced-motion: reduce)');
  var still = /[?&]static(?:=|&|$)/.test(location.search);
  var panels = Array.from(document.querySelectorAll('main .textile-panel'));
  if (!('IntersectionObserver' in window)) return;
  var visible = new Set();
  var arrived = new WeakSet(), entrances = new Map();
  function sync() {
    panels.forEach(function (panel) {
      var moving = !document.hidden && !preference.matches && !still;
      var active = visible.has(panel) && moving;
      panel.classList.toggle('is-textile-visible', active);
      if (!moving && entrances.has(panel)) {
        entrances.get(panel).cancel();
        entrances.delete(panel);
      }
      if (active && !arrived.has(panel)) {
        arrived.add(panel);
        if (!panel.animate) return;
        var opacity = getComputedStyle(panel).opacity;
        var entrance = panel.animate([
          {opacity: 0, translate: '0 12px'}, {opacity: opacity, translate: '0 0'}
        ], {duration: 1400, easing: 'cubic-bezier(.16,1,.3,1)'});
        entrances.set(panel, entrance);
        entrance.onfinish = function () {entrances.delete(panel);};
      }
    });
  }
  panels.forEach(function (panel) {
    panel.dataset.textileMotion = panel.classList.contains('print-paisley') || panel.classList.contains('print-tree') ? 'botanical' : 'woven';
  });
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var panel = entry.target.querySelector('.textile-panel');
      if (entry.isIntersecting) visible.add(panel); else visible.delete(panel);
    });
    sync();
  }, {threshold: 0});
  panels.forEach(function (panel) {observer.observe(panel.closest('section'));});
  preference.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('beforeprint', function () {visible.clear();sync();});
})();
