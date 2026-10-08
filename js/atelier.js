/* The playful parts are real interactions, progressively enhanced. */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]static/.test(location.search);
  var colors={butter:'#f4e6a7',blue:'#d9e3f9',rose:'#efd5d0',sage:'#dce9db'};
  var dialog=document.getElementById('noteDialog'),form=document.getElementById('noteForm'),noteStatus=document.getElementById('noteStatus'),openButton=document.getElementById('noteOpen'),oldOverflow;
  openButton.addEventListener('click',function(){document.dispatchEvent(new CustomEvent('portfolio:before-dialog'));oldOverflow=document.body.style.overflow;dialog.showModal();document.body.style.overflow='hidden';document.dispatchEvent(new CustomEvent('portfolio:dialog',{detail:{open:true}}));});
  dialog.querySelector('.note-close').addEventListener('click',function(){dialog.close();});dialog.addEventListener('close',function(){document.body.style.overflow=oldOverflow;document.dispatchEvent(new CustomEvent('portfolio:dialog',{detail:{open:false}}));openButton.focus({preventScroll:true});});
  dialog.addEventListener('click',function(e){if(e.target!==dialog)return;var r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
  var canvas=document.getElementById('noteCanvas'),ctx=canvas.getContext('2d'),strokes=[],stroke=null,mode='write';
  ctx.strokeStyle='#34352b';ctx.lineWidth=3;ctx.lineJoin='round';ctx.lineCap='round';
  function draw(){ctx.clearRect(0,0,520,320);strokes.forEach(function(s){ctx.beginPath();s.forEach(function(p,i){if(i)ctx.lineTo(p[0],p[1]);else ctx.moveTo(p[0],p[1]);});ctx.stroke();});}
  function point(e){var r=canvas.getBoundingClientRect();return [Math.round(Math.max(0,Math.min(520,(e.clientX-r.left)*520/r.width))),Math.round(Math.max(0,Math.min(320,(e.clientY-r.top)*320/r.height)))];}
  canvas.addEventListener('pointerdown',function(e){if(e.button!==0||strokes.length>=80)return;e.preventDefault();canvas.setPointerCapture(e.pointerId);stroke=[point(e)];strokes.push(stroke);draw();});
  canvas.addEventListener('pointermove',function(e){if(!stroke||stroke.length>=250)return;stroke.push(point(e));draw();});
  function endStroke(){if(stroke&&stroke.length===1)stroke.push([stroke[0][0]+.2,stroke[0][1]+.2]);stroke=null;draw();}canvas.addEventListener('pointerup',endStroke);canvas.addEventListener('pointercancel',endStroke);
  document.getElementById('noteClear').addEventListener('click',function(){strokes=[];draw();});
  document.querySelectorAll('[data-note-mode]').forEach(function(b){b.addEventListener('click',function(){mode=b.dataset.noteMode;document.querySelectorAll('[data-note-mode]').forEach(function(other){other.setAttribute('aria-pressed',String(other===b));});document.getElementById('noteWrite').hidden=mode!=='write';document.getElementById('noteDraw').hidden=mode!=='draw';noteStatus.textContent='';});});
  document.getElementById('noteText').addEventListener('input',function(){document.getElementById('noteCount').textContent=this.value.length;});
  form.addEventListener('change',function(e){if(e.target.name==='color')canvas.style.backgroundColor=colors[e.target.value];});
  form.addEventListener('submit',async function(e){e.preventDefault();var text=document.getElementById('noteText').value.trim(),button=document.getElementById('noteSubmit');if(mode==='write'&&!text){noteStatus.textContent='Write a little something first.';document.getElementById('noteText').focus();return;}if(mode==='draw'&&!strokes.length){noteStatus.textContent='Draw a little something first, or switch to a written note.';return;}
    var payload={name:document.getElementById('noteName').value.trim(),color:form.elements.color.value,text:mode==='write'?text:'',strokes:mode==='draw'?strokes:[],website:''};button.disabled=true;noteStatus.textContent='Finding a spot on the board…';
    try{await window.VisitorCanvas.add(payload);dialog.close();form.reset();strokes=[];draw();document.getElementById('noteCount').textContent='0';canvas.style.backgroundColor=colors.butter;noteStatus.textContent='';if(!reduced)document.getElementById('visitorBoard').scrollIntoView({behavior:'smooth',block:'center'});}
    catch(error){noteStatus.textContent=error.message||'Your note could not be saved. Try again shortly.';}finally{button.disabled=false;}
  });
})();
