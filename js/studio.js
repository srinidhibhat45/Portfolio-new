/* A quick introduction, project discovery, and contact shortcuts. */
(function () {
  'use strict';
  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function showWork() {
    document.querySelector('.nav-links a[href="#work"]').click();
  }

  var dialog = document.getElementById('recruiterDialog');
  var dialogOpener, priorOverflow;
  document.querySelectorAll('[data-recruiter-open]').forEach(function (button) {
    button.addEventListener('click', function () {
      document.dispatchEvent(new CustomEvent('portfolio:before-dialog'));
      dialogOpener = button;
      priorOverflow = document.body.style.overflow;
      dialog.showModal();
      document.body.style.overflow = 'hidden';
      document.dispatchEvent(new CustomEvent('portfolio:dialog', { detail: { open: true } }));
    });
  });
  dialog.querySelector('.recruiter-close').addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('click', function (event) {
    if (event.target !== dialog) return;
    var bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', function () {
    document.body.style.overflow = priorOverflow;
    document.dispatchEvent(new CustomEvent('portfolio:dialog', { detail: { open: false } }));
    if (dialogOpener) dialogOpener.focus({ preventScroll: true });
  });
  document.getElementById('recruiterSeeWork').addEventListener('click', function () {
    // The native close event is queued; navigate after its focus restoration.
    dialog.addEventListener('close', function () { showWork('work'); }, { once: true });
    dialog.close();
  });

  var copyButton = document.getElementById('copyEmail');
  var copyStatus = document.getElementById('copyStatus'), copyTimer;
  // The message is a passing confirmation, not a fixture: it clears itself.
  function say(text, hold) {
    copyStatus.textContent = text;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(function () { copyStatus.textContent = ''; }, hold);
  }
  copyButton.addEventListener('click', async function () {
    var email = document.querySelector('.contact-direct a').getAttribute('href').slice(7);
    try {
      await navigator.clipboard.writeText(email);
      // The button is an icon: swap it for a tick for a moment.
      copyButton.classList.add('is-copied');
      setTimeout(function () { copyButton.classList.remove('is-copied'); }, 2000);
      say('Email address copied.', 4000);
    } catch (_) {
      say('Copying is blocked here. Select the address, or click it to open your email app.', 8000);
    }
  });

  var navLinks = Array.from(document.querySelectorAll('.nav-links a'));
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      navLinks.forEach(function (link) {
        if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-15% 0px -65% 0px', threshold: 0 });
  navLinks.forEach(function (link) {
    var section = document.querySelector(link.hash);
    if (section) observer.observe(section);
  });
  observer.observe(document.getElementById('hero'));
  var briefDetails = document.querySelector('.brief-details');
  if (briefDetails) briefDetails.addEventListener('toggle', function () {
    document.dispatchEvent(new CustomEvent('portfolio:layout'));
  });

  /* Direct angular dragging with frame-rate-independent friction. */
  (function () {
    const jaali = document.querySelector('.portrait-mandala');
    if (!jaali) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let angle = 0, speed = 0, pointer = null, previousAngle = 0;
    let previousTime = 0, lastMove = 0, frame = 0, frameTime = 0;
    const fullTurn = Math.PI * 2;
    function paint() {
      jaali.style.setProperty('--jaali-angle', angle + 'rad');
      jaali.setAttribute('aria-valuenow', Math.round(((angle % fullTurn + fullTurn) % fullTurn) / fullTurn * 360));
    }
    function stop() {
      cancelAnimationFrame(frame); frame = 0; speed = 0;
    }
    function tick(now) {
      frame = 0;
      const seconds = Math.min((now - frameTime) / 1000, .05);
      frameTime = now;
      angle += speed * seconds;
      speed *= Math.exp(-seconds * (preference.matches ? 7 : .8));
      paint();
      if (Math.abs(speed) > .015) frame = requestAnimationFrame(tick);
    }
    function coast() {
      if (frame) cancelAnimationFrame(frame);
      frameTime = performance.now();
      frame = requestAnimationFrame(tick);
    }
    function pointerAngle(event) {
      const rect = jaali.getBoundingClientRect();
      return Math.atan2(event.clientY - rect.top - rect.height / 2, event.clientX - rect.left - rect.width / 2);
    }
    jaali.addEventListener('pointerdown', function (event) {
      if (event.button !== 0 || pointer !== null) return;
      stop(); pointer = event.pointerId;
      previousAngle = pointerAngle(event);
      previousTime = lastMove = performance.now();
      jaali.setPointerCapture(pointer);
      jaali.classList.add('is-spinning');
    });
    jaali.addEventListener('pointermove', function (event) {
      if (event.pointerId !== pointer) return;
      const next = pointerAngle(event), now = performance.now();
      let delta = next - previousAngle;
      delta = Math.atan2(Math.sin(delta), Math.cos(delta));
      const seconds = Math.max((now - previousTime) / 1000, .008);
      angle += delta;
      speed = speed * .25 + Math.max(-24, Math.min(24, delta / seconds)) * .75;
      previousAngle = next; previousTime = lastMove = now;
      paint();
    });
    function release(event) {
      if (event.pointerId !== pointer) return;
      const id = pointer; pointer = null;
      jaali.classList.remove('is-spinning');
      if (jaali.hasPointerCapture(id)) jaali.releasePointerCapture(id);
      if (event.type !== 'pointerup' || performance.now() - lastMove > 100) speed = 0;
      if (speed) coast();
    }
    jaali.addEventListener('pointerup', release);
    jaali.addEventListener('pointercancel', release);
    jaali.addEventListener('lostpointercapture', release);
    jaali.addEventListener('dragstart', event => event.preventDefault());
    jaali.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault(); speed += event.key === 'ArrowRight' ? 5 : -5; coast();
      }
      if (event.key === 'Escape') stop();
    });
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); });
    new IntersectionObserver(function (entries) { if (!entries[0].isIntersecting) stop(); }).observe(jaali);
    preference.addEventListener('change', stop);
    paint();
  })();
})();
