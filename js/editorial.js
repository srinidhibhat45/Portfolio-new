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
})();
