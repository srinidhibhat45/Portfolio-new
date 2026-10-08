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
  var copyStatus = document.getElementById('copyStatus');
  copyButton.addEventListener('click', async function () {
    var email = document.querySelector('.contact-direct a').getAttribute('href').slice(7);
    try {
      await navigator.clipboard.writeText(email);
      copyButton.textContent = 'Copied ✓';
      copyStatus.textContent = 'Email address copied. Say hello whenever you’re ready.';
    } catch (_) {
      copyStatus.textContent = 'You can select the email address above, or click it to open your email app.';
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
  document.querySelector('.brief-details').addEventListener('toggle', function () {
    document.dispatchEvent(new CustomEvent('portfolio:layout'));
  });

  /* The portrait's slow orbit rests when off screen or the tab is hidden. */
  (function () {
    var photo = document.querySelector('.heritage-photo');
    if (!photo) return;
    var motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    var inView = false;
    function syncOrbit() {
      photo.classList.toggle('is-rotating', inView && !document.hidden && !motionPreference.matches && !/[?&]static/.test(location.search));
    }
    if ('IntersectionObserver' in window) {
      var orbitObserver = new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        syncOrbit();
      });
      orbitObserver.observe(photo);
    } else { inView = true; syncOrbit(); }
    document.addEventListener('visibilitychange', syncOrbit);
    motionPreference.addEventListener('change', syncOrbit);
  })();
})();
