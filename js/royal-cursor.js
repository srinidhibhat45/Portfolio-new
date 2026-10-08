/* Keep the native cursor's precise position; change the glove as it grips. */
(function () {
  var fine = matchMedia('(hover:hover) and (pointer:fine)'), root = document.documentElement;
  root.classList.remove('has-cursor');
  var old = document.getElementById('cursor');
  if (old) old.hidden = true;
  function release() { root.classList.remove('royal-grabbing'); }
  document.addEventListener('pointerdown', function (event) {
    if (!fine.matches || event.button !== 0 || event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
    root.classList.add('royal-grabbing');
  });
  document.addEventListener('pointerup',release);
  document.addEventListener('pointercancel',release);
  window.addEventListener('blur',release);
  document.addEventListener('visibilitychange',function(){if(document.hidden)release();});
  fine.addEventListener('change',release);
})();
