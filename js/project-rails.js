/* Native scrolling, with buttons and keyboard access for every project. */
(function () {
  'use strict';
  var preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  var staticMode=/[?&]static/.test(location.search);
  var workControls=document.getElementById('workNavigation');
  var playControls=document.getElementById('playNavigation');
  function setup(controls,getPanel){
    var previous=controls.querySelector('[data-project-direction="-1"]');
    var next=controls.querySelector('[data-project-direction="1"]');
    var position=controls.querySelector('.project-position'),timer;
    function items(panel){return Array.from(panel.children).filter(function(card){return !card.hidden;});}
    function update(){
      var panel=getPanel(),cards=items(panel),bounds=panel.getBoundingClientRect();
      panel.classList.toggle('can-drag',panel.scrollWidth>panel.clientWidth+2);
      var showing=cards.map(function(card,i){var r=card.getBoundingClientRect();var overlap=Math.min(r.right,bounds.right)-Math.max(r.left,bounds.left);return overlap>Math.min(r.width,panel.clientWidth)*.5?i:-1;}).filter(function(i){return i>=0;});
      controls.hidden=!panel.getClientRects().length||cards.length<2||panel.scrollWidth<=panel.clientWidth+2;
      previous.disabled=panel.scrollLeft<=2;
      next.disabled=panel.scrollLeft>=panel.scrollWidth-panel.clientWidth-2;
      var first=showing.length?showing[0]+1:1,last=showing.length?showing[showing.length-1]+1:first;
      var pad=function(n){return String(n).padStart(2,'0');};
      position.textContent=pad(first)+(last!==first?'–'+pad(last):'')+' / '+pad(cards.length);
    }
    function move(direction){
      var panel=getPanel(),cards=items(panel);if(!cards.length)return;
      var gap=parseFloat(getComputedStyle(panel).columnGap)||0;
      var step=cards[0].getBoundingClientRect().width+gap;
      var count=Math.max(1,Math.floor((panel.clientWidth+gap)/step));
      panel.scrollBy({left:direction*step*count,behavior:preference.matches||staticMode?'instant':'smooth'});
    }
    previous.addEventListener('click',function(){move(-1);});next.addEventListener('click',function(){move(1);});
    var panels=[getPanel()];
    panels.forEach(function(panel){
      window.enableProjectDrag(panel,function(){return preference.matches||staticMode;});
      panel.addEventListener('scroll',function(){clearTimeout(timer);timer=setTimeout(update,120);},{passive:true});
      panel.addEventListener('keydown',function(event){
        if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)||event.altKey||event.ctrlKey||event.metaKey)return;
        var cards=items(panel),index=cards.indexOf(document.activeElement),target;
        if(event.key==='Home')target=cards[0];else if(event.key==='End')target=cards[cards.length-1];
        else target=cards[Math.max(0,Math.min(cards.length-1,index+(event.key==='ArrowRight'?1:-1)))];
        if(!target)return;event.preventDefault();target.focus({preventScroll:true});
        var left=target.offsetLeft-cards[0].offsetLeft;
        panel.scrollTo({left:left,behavior:preference.matches||staticMode?'instant':'smooth'});
      });
    });
    document.addEventListener('portfolio:projects-filtered',function(event){
      var panel=getPanel();if(event.detail.panel!==panel.id)return;panel.scrollTo({left:0,behavior:'instant'});update();
    });
    document.addEventListener('portfolio:layout',update);
    if('ResizeObserver' in window){var observer=new ResizeObserver(update);panels.forEach(function(panel){observer.observe(panel);});}
    else window.addEventListener('resize',update);
    update();
  }
  setup(workControls,function(){return document.getElementById('cards');});
  setup(playControls,function(){return document.getElementById('playGrid');});
})();
