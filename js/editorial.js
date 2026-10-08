/* Quiet motion, with an explicit way to rest the artwork wall. */
(function(){
  'use strict';
  var collage=document.getElementById('collage'),pause=document.getElementById('galleryMotion');
  pause.addEventListener('click',function(){
    var paused=collage.dataset.motionPaused!=='true';
    collage.dataset.motionPaused=String(paused);pause.setAttribute('aria-pressed',String(paused));
    pause.innerHTML=(paused?'Resume motion':'Pause motion')+' <span aria-hidden="true">'+(paused?'▷':'Ⅱ')+'</span>';
  });
  document.querySelectorAll('.test-full-note').forEach(function(note){note.addEventListener('toggle',function(){document.dispatchEvent(new CustomEvent('portfolio:layout'));});});
  var room=document.getElementById('writing'),preference=window.matchMedia('(prefers-reduced-motion: reduce)'),visible=false;
  function sync(){room.classList.toggle('is-in-view',visible&&!document.hidden&&!preference.matches&&!/[?&]static/.test(location.search));}
  new IntersectionObserver(function(entries){visible=entries[0].isIntersecting;sync();}).observe(room);
  document.addEventListener('visibilitychange',sync);preference.addEventListener('change',sync);
})();
