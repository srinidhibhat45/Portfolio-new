/* Lets a mouse drag scroll a strip, the way a finger does on a touch screen.
   Applies to the project rails and the games room's row of chips. */
(function () {
  'use strict';
  function enable(strip) {
    var drag = null, dragged = false;
    strip.addEventListener('pointerdown', function (event) {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      dragged = false;
      drag = {id: event.pointerId, x: event.clientX, y: event.clientY, left: strip.scrollLeft, top: strip.scrollTop, moved: false};
    });
    strip.addEventListener('pointermove', function (event) {
      if (!drag || event.pointerId !== drag.id) return;
      var dx = event.clientX - drag.x, dy = event.clientY - drag.y;
      if (!drag.moved) {
        // A small wobble is still a click.
        if (Math.abs(dx) + Math.abs(dy) < 6) return;
        drag.moved = true;
        strip.classList.add('is-dragging');
        strip.setPointerCapture(event.pointerId);
      }
      strip.scrollLeft = drag.left - dx;
      strip.scrollTop = drag.top - dy;
    });
    function release(event) {
      if (!drag || event.pointerId !== drag.id) return;
      dragged = drag.moved;
      drag = null;
      strip.classList.remove('is-dragging');
    }
    strip.addEventListener('pointerup', release);
    strip.addEventListener('pointercancel', release);
    // Letting go after a drag must not open the card under the pointer.
    strip.addEventListener('click', function (event) {
      if (!dragged) return;
      dragged = false;
      event.preventDefault();
      event.stopPropagation();
    }, true);
    strip.addEventListener('dragstart', function (event) { event.preventDefault(); });
  }
  document.querySelectorAll('[data-drag-scroll], .play-chips').forEach(enable);
})();
