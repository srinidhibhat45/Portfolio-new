/* Quiet motion, with an explicit way to rest the artwork wall. */
(function(){
  'use strict';
  var collage=document.getElementById('collage'),pause=document.getElementById('galleryMotion');
  if(collage&&pause)pause.addEventListener('click',function(){
    var paused=collage.dataset.motionPaused!=='true';
    collage.dataset.motionPaused=String(paused);pause.setAttribute('aria-pressed',String(paused));
    pause.innerHTML=(paused?'Resume motion':'Pause motion')+' <span aria-hidden="true">'+(paused?'▷':'Ⅱ')+'</span>';
  });
  document.querySelectorAll('.test-flip-card').forEach(function(card){
    var front=card.querySelector('.test-front'),back=card.querySelector('.test-back');
    var read=card.querySelector('[data-test-flip="back"]');
    back.hidden=false;card.classList.add('is-ready');
    function flip(showBack){
      card.classList.toggle('is-flipped',showBack);
      front.inert=showBack;back.inert=!showBack;
      front.setAttribute('aria-hidden',String(showBack));back.setAttribute('aria-hidden',String(!showBack));
      read.setAttribute('aria-expanded',String(showBack));
      (showBack?back.querySelector('.test-back-title'):read).focus({preventScroll:true});
    }
    card.querySelectorAll('[data-test-flip]').forEach(function(button){button.addEventListener('click',function(){flip(button.dataset.testFlip==='back');});});
    card.addEventListener('keydown',function(event){if(event.key==='Escape'&&card.classList.contains('is-flipped')){event.preventDefault();flip(false);}});
  });
})();
