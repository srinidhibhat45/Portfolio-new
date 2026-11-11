/* Accessibility mode. One attribute on <html> (data-access="on") hands the page to css/access.css:
   plain high-contrast colours, larger type, one column, nothing moving. This script flips the
   attribute, remembers the choice, and puts the few scripted parts of the page (gallery, brain map,
   testimonials, visitor board) into their still, readable form, then back again. */
(function () {
  'use strict';
  var KEY = 'portfolio-access';
  var root = document.documentElement;
  var changed = {};
  var notesWatch = null, notesTimer = 0;

  function byId(id) { return document.getElementById(id); }
  function isOn() { return root.getAttribute('data-access') === 'on'; }
  function pressed(el) { return !!el && el.getAttribute('aria-pressed') === 'true'; }
  function remember(on) { try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) {} }

  /* Scripted scrolling does not glide while the mode is on. */
  function still(options) {
    return isOn() && options && typeof options === 'object' ? Object.assign({}, options, { behavior: 'instant' }) : options;
  }
  ['scrollTo', 'scrollBy'].forEach(function (name) {
    var onWindow = window[name], onElement = Element.prototype[name];
    window[name] = function (a, b) { return arguments.length > 1 ? onWindow.call(window, a, b) : onWindow.call(window, still(a)); };
    Element.prototype[name] = function (a, b) { return arguments.length > 1 ? onElement.call(this, a, b) : onElement.call(this, still(a)); };
  });
  var intoView = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function (a) { return intoView.call(this, still(a)); };

  /* ---- Gallery: a still grid instead of three moving rows ---- */
  function setGallery(on) {
    var collage = byId('collage'), browse = byId('galleryBrowse'), motion = byId('galleryMotion');
    if (!collage || !browse) return;
    if (on) {
      if (motion && !motion.hidden && !pressed(motion)) { motion.click(); changed.galleryMotion = true; }
      if (!collage.classList.contains('is-browsing')) { browse.click(); changed.galleryBrowse = true; }
    } else {
      if (changed.galleryBrowse && collage.classList.contains('is-browsing')) browse.click();
      if (changed.galleryMotion && motion && pressed(motion)) motion.click();
      changed.galleryBrowse = changed.galleryMotion = false;
    }
  }

  /* ---- Brain: the list view, with the map's motion paused underneath ---- */
  function setBrain(on) {
    var view = byId('brainView'), motion = byId('brainMotion');
    if (!view || !motion) return;
    if (on) {
      if (!motion.disabled && !pressed(motion)) { motion.click(); changed.brainMotion = true; }
      if (!pressed(view)) { view.click(); changed.brainView = true; }
    } else {
      if (changed.brainView && pressed(view)) view.click();
      if (changed.brainMotion && !motion.disabled && pressed(motion)) motion.click();
      changed.brainView = changed.brainMotion = false;
    }
  }

  /* ---- Music stops; it is not started again when the mode is turned off ---- */
  function stopMusic() {
    var play = byId('musicPlay');
    if (play && play.getAttribute('aria-label') === 'Pause music') play.click();
  }

  /* ---- Testimonials: both faces of each card are readable at once, so nothing needs flipping ---- */
  var cardState = new WeakMap();
  function setTestimonials(on) {
    document.querySelectorAll('.test-flip-card').forEach(function (card) {
      var front = card.querySelector('.test-front'), back = card.querySelector('.test-back');
      var scroll = card.querySelector('.test-note-scroll');
      if (!front || !back) return;
      if (on) {
        cardState.set(card, {
          frontInert: front.inert, backInert: back.inert,
          frontHidden: front.getAttribute('aria-hidden'), backHidden: back.getAttribute('aria-hidden'),
          stop: scroll ? scroll.getAttribute('tabindex') : null
        });
        front.inert = back.inert = false;
        front.setAttribute('aria-hidden', 'false');
        back.setAttribute('aria-hidden', 'false');
        if (scroll) scroll.removeAttribute('tabindex');
        return;
      }
      var was = cardState.get(card);
      if (!was) return;
      cardState.delete(card);
      front.inert = was.frontInert;
      back.inert = was.backInert;
      [[front, was.frontHidden], [back, was.backHidden]].forEach(function (pair) {
        if (pair[1] === null) pair[0].removeAttribute('aria-hidden'); else pair[0].setAttribute('aria-hidden', pair[1]);
      });
      if (scroll && was.stop !== null) scroll.setAttribute('tabindex', was.stop);
    });
  }

  /* ---- Card rails: laid out as a grid by the stylesheet, so they stop being a scroll region ---- */
  function setRails(on) {
    document.querySelectorAll('.cover-grid').forEach(function (rail) {
      if (on) { if (rail.hasAttribute('tabindex')) { rail.dataset.accessStop = rail.getAttribute('tabindex'); rail.removeAttribute('tabindex'); } }
      else if (rail.dataset.accessStop !== undefined) { rail.setAttribute('tabindex', rail.dataset.accessStop); delete rail.dataset.accessStop; }
      rail.scrollLeft = 0;
      rail.dispatchEvent(new Event('scroll'));
    });
  }

  /* ---- Visitor board: the notes as a plain list, kept in step with the canvas ---- */
  function listNotes() {
    var world = byId('boardWorld'), frame = document.querySelector('#board .board-frame');
    if (!world || !frame) return;
    var box = byId('accessNotes');
    if (!box) {
      box = document.createElement('div');
      box.id = 'accessNotes';
      box.className = 'access-notes';
      box.innerHTML = '<h3 id="accessNotesTitle">Notes on the board</h3><ul aria-labelledby="accessNotesTitle"></ul>';
      frame.insertAdjacentElement('afterend', box);
    }
    var list = box.querySelector('ul');
    list.textContent = '';
    world.querySelectorAll('.pinned-note').forEach(function (note) {
      var item = document.createElement('li');
      var text = note.querySelector('p'), drawing = note.querySelector('svg');
      if (text) {
        var words = document.createElement('p');
        words.className = 'access-note-text';
        words.textContent = text.textContent;
        item.append(words);
      } else if (drawing) {
        var copy = drawing.cloneNode(true);
        copy.setAttribute('class', 'access-note-doodle');
        item.append(copy);
      }
      var by = Array.prototype.map.call(note.querySelectorAll('footer span'), function (part) { return part.textContent.replace(/[↗→]/g, '').trim(); }).filter(Boolean).join(', ');
      if (by) {
        var credit = document.createElement('p');
        credit.className = 'access-note-by';
        credit.textContent = by;
        item.append(credit);
      }
      if (item.childNodes.length) list.append(item);
    });
  }
  function setNotes(on) {
    var world = byId('boardWorld');
    if (!world) return;
    if (notesWatch) { notesWatch.disconnect(); notesWatch = null; }
    clearTimeout(notesTimer);
    if (!on) { var box = byId('accessNotes'); if (box) box.remove(); return; }
    listNotes();
    notesWatch = new MutationObserver(function () { clearTimeout(notesTimer); notesTimer = setTimeout(listNotes, 120); });
    notesWatch.observe(world, { childList: true });
  }

  function apply(on) {
    if (on) stopMusic();
    setGallery(on);
    setBrain(on);
    setTestimonials(on);
    setRails(on);
    setNotes(on);
    window.dispatchEvent(new Event('resize'));
    document.dispatchEvent(new CustomEvent('portfolio:layout'));
  }

  /* ---- The three switches say the same thing: the tab, the skip-style button, the bar ---- */
  function sync() {
    var on = isOn(), label = on ? 'Turn off accessibility mode' : 'Turn on accessibility mode';
    document.querySelectorAll('[data-access-toggle]').forEach(function (button) {
      if (button.id === 'accessTab') {
        button.setAttribute('aria-pressed', String(on));
        button.title = label;
        var text = button.querySelector('.access-tab-text');
        if (text) text.textContent = label;
      } else if (!button.closest('#accessBar')) button.textContent = label;
    });
    var bar = byId('accessBar');
    if (bar) bar.hidden = !on;
  }

  function announce(text) {
    var live = byId('accessLive');
    if (!live) return;
    live.textContent = text;
  }

  /* Keep the reader at the same chapter when the layout changes under them. */
  function place() {
    if (window.scrollY < 8) return null;
    var sections = document.querySelectorAll('main > section'), line = 96;
    for (var i = 0; i < sections.length; i++) {
      var box = sections[i].getBoundingClientRect();
      if (box.bottom > line) return { el: sections[i], part: Math.max(0, Math.min(1, (line - box.top) / Math.max(1, box.height))) };
    }
    return null;
  }
  function returnTo(spot) {
    if (!spot) { window.scrollTo(0, 0); return; }
    var box = spot.el.getBoundingClientRect();
    window.scrollTo(0, Math.max(0, window.scrollY + box.top + spot.part * box.height - 96));
  }

  function setMode(on, source) {
    if (on === isOn()) return;
    var spot = place();
    if (on) root.setAttribute('data-access', 'on'); else root.removeAttribute('data-access');
    remember(on);
    if (!on && /[?&]access=on\b/.test(location.search) && window.history && history.replaceState) {
      history.replaceState(null, '', location.pathname + location.search.replace(/([?&])access=on&?/, '$1').replace(/[?&]$/, '') + location.hash);
    }
    apply(on);
    sync();
    returnTo(spot);
    announce(on
      ? 'Accessibility mode is on. High contrast, larger text, one column and no motion. Jimmy, the music player and decorative art are hidden.'
      : 'Accessibility mode is off. The standard site is back.');
    /* Focus stays on the switch that was used when it is still there; otherwise it moves to its counterpart. */
    var visible = source && source.getClientRects().length > 0;
    if (!visible) {
      var next = on ? document.querySelector('#accessBar [data-access-toggle]') : byId('accessTab');
      if (next) next.focus({ preventScroll: true });
    }
  }

  /* ---- Contact form: errors are written next to their fields, in both modes.
     With the mode off they stay visually hidden and the browser's own bubble still shows. ---- */
  function wireForm() {
    var form = byId('contactForm'), status = byId('cfStatus');
    if (!form) return;
    var fields = Array.prototype.slice.call(form.querySelectorAll('input[required], textarea[required], select[required]'));
    var queued = false;
    function label(field) {
      var el = form.querySelector('label[for="' + field.id + '"]');
      return el ? el.textContent.trim() : 'This field';
    }
    fields.forEach(function (field) {
      var error = document.createElement('p');
      error.className = 'cf-error';
      error.id = field.id + '-error';
      error.hidden = true;
      field.insertAdjacentElement('afterend', error);
      field.setAttribute('aria-describedby', ((field.getAttribute('aria-describedby') || '') + ' ' + error.id).trim());
      field.addEventListener('invalid', function (event) {
        error.textContent = field.validity.valueMissing ? label(field) + ' is required.'
          : field.validity.typeMismatch && field.type === 'email' ? 'Enter an email address like name@example.com.'
          : field.validationMessage;
        error.hidden = false;
        field.setAttribute('aria-invalid', 'true');
        if (!isOn()) return;
        event.preventDefault();
        if (queued) return;
        queued = true;
        setTimeout(function () {
          queued = false;
          var wrong = fields.filter(function (item) { return item.getAttribute('aria-invalid') === 'true'; });
          if (!wrong.length) return;
          if (status) {
            status.className = 'cf-status is-err';
            status.textContent = (wrong.length === 1 ? 'One field needs attention: ' : wrong.length + ' fields need attention: ') + wrong.map(label).join(', ') + '.';
          }
          wrong[0].focus();
        }, 0);
      });
      field.addEventListener('input', function () {
        if (!field.validity.valid) return;
        error.hidden = true;
        error.textContent = '';
        field.removeAttribute('aria-invalid');
      });
    });
    form.addEventListener('reset', function () {
      fields.forEach(function (field) {
        var error = byId(field.id + '-error');
        if (error) { error.hidden = true; error.textContent = ''; }
        field.removeAttribute('aria-invalid');
      });
    });
  }

  /* ---- Language of parts: Devanagari text (the pen name's first letter) is marked as Hindi,
     including where scripts write it into the page. Works in both modes and changes nothing visible. ---- */
  var DEVANAGARI = /[\u0900-\u097F]+/;
  function markLanguage(scope) {
    var walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT), found = [], node;
    while ((node = walker.nextNode())) {
      if (!DEVANAGARI.test(node.nodeValue)) continue;
      var parent = node.parentElement;
      if (!parent || parent.closest('[lang="hi"], script, style, svg, textarea, option, [aria-hidden="true"]')) continue;
      found.push(node);
    }
    found.forEach(function (text) {
      var parts = text.nodeValue.split(/([\u0900-\u097F]+)/), piece = document.createDocumentFragment();
      parts.forEach(function (part) {
        if (!part) return;
        if (DEVANAGARI.test(part)) { var span = document.createElement('span'); span.lang = 'hi'; span.textContent = part; piece.append(span); }
        else piece.append(part);
      });
      text.replaceWith(piece);
    });
  }
  function watchLanguage() {
    markLanguage(document.body);
    ['brainDetail', 'brainList', 'brainTrail', 'cvScroll'].forEach(function (id) {
      var el = byId(id);
      if (el) new MutationObserver(function () { markLanguage(el); }).observe(el, { childList: true, subtree: true });
    });
  }

  function start() {
    /* The switches are in the markup but hidden until this script is here to work them. */
    document.querySelectorAll('[data-access-toggle]').forEach(function (button) {
      button.hidden = false;
      button.addEventListener('click', function () { setMode(!isOn(), button); });
    });
    wireForm();
    watchLanguage();
    sync();
    if (isOn()) { remember(true); apply(true); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
