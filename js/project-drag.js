/* Mouse dragging enhances native touch and trackpad scrolling. */
(function () {
  'use strict';
  window.enableProjectDrag=function(panel,reducedMotion){
    var gesture=null,blockClickUntil=0;
    function finish(event){
      if(!gesture||event.pointerId!==gesture.id)return;
      var current=gesture;gesture=null;
      if(current.dragged){
        var cards=Array.from(panel.children).filter(function(card){return !card.hidden;});
        var left=panel.scrollLeft,max=Math.max(0,panel.scrollWidth-panel.clientWidth),target=left;
        if(cards.length){
          var starts=cards.map(function(card){return Math.min(max,card.offsetLeft-cards[0].offsetLeft);});
          target=starts.reduce(function(best,value){return Math.abs(value-left)<Math.abs(best-left)?value:best;},starts[0]);
        }
        blockClickUntil=Date.now()+400;
        panel.classList.remove('is-dragging');
        panel.scrollTo({left:target,behavior:reducedMotion()?'instant':'smooth'});
      }
      if(panel.hasPointerCapture(current.id))panel.releasePointerCapture(current.id);
    }
    panel.addEventListener('pointerdown',function(event){
      blockClickUntil=0;
      if(event.pointerType!=='mouse'||event.button!==0||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey||panel.scrollWidth<=panel.clientWidth+2)return;
      gesture={id:event.pointerId,x:event.clientX,y:event.clientY,left:panel.scrollLeft,dragged:false};
    });
    panel.addEventListener('pointermove',function(event){
      if(!gesture||event.pointerId!==gesture.id)return;
      var dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
      if(!gesture.dragged){
        if(Math.abs(dy)>8&&Math.abs(dy)>Math.abs(dx)){gesture=null;return;}
        if(Math.abs(dx)<8)return;
        gesture.dragged=true;panel.classList.add('is-dragging');panel.setPointerCapture(event.pointerId);
      }
      event.preventDefault();
      panel.scrollLeft=Math.max(0,Math.min(panel.scrollWidth-panel.clientWidth,gesture.left-dx));
    });
    panel.addEventListener('pointerup',finish);
    panel.addEventListener('pointercancel',finish);
    panel.addEventListener('lostpointercapture',finish);
    panel.ownerDocument.addEventListener('pointerup',finish);
    panel.addEventListener('dragstart',function(event){if(panel.scrollWidth>panel.clientWidth+2)event.preventDefault();});
    panel.addEventListener('click',function(event){
      if(event.detail>0&&Date.now()<blockClickUntil){event.preventDefault();event.stopImmediatePropagation();blockClickUntil=0;}
    },true);
  };
})();
