/* A shared canvas of real visitor notes, with movable starter decorations. */
(function(){
  'use strict';
  var viewport=document.getElementById('visitorBoard'),world=document.getElementById('boardWorld');
  if(!viewport||!world)return;
  var W=1400,H=900,records=new Map(),selected=null,gesture=null,tool='move',camera={x:0,y:0,scale:1},history=[],z=10;
  var status=document.getElementById('boardStatus'),palette=document.getElementById('boardPalette'),stickerButton=document.getElementById('boardSticker');
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)'),pending=new Set(),queues=new Map(),keyTimers=new Map(),posting=false,visible=false;
  var colors={butter:'#f4e6a7',blue:'#d9e3f9',rose:'#efd5d0',sage:'#dce9db'};
  var stickers=[['🙂','Smile'],['💛','Heart'],['✨','Sparkles'],['🪷','Lotus'],['🌴','Palm'],['🌻','Sunflower'],['☀️','Sun'],['🦋','Butterfly'],['🎨','Palette'],['🚀','Rocket'],['☕','Coffee'],['🍀','Clover']];
  function copy(p){return {x:p.x,y:p.y,rotation:p.rotation};}
  function svg(tag,attrs){var e=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.keys(attrs).forEach(function(k){e.setAttribute(k,attrs[k]);});return e;}
  function place(record,p){
    record.position={x:Math.max(20,Math.min(W-record.el.offsetWidth-20,p.x)),y:Math.max(20,Math.min(H-record.el.offsetHeight-20,p.y)),rotation:Math.max(-15,Math.min(15,p.rotation))};
    record.el.style.left=record.position.x+'px';record.el.style.top=record.position.y+'px';record.el.style.setProperty('--note-angle',record.position.rotation+'deg');
  }
  function paint(){world.style.transform='translate('+camera.x+'px,'+camera.y+'px) scale('+camera.scale+')';document.getElementById('boardZoomLabel').textContent=Math.round(camera.scale*100)+'%';}
  function fit(){var scale=Math.min(viewport.clientWidth/W,viewport.clientHeight/H)*.96;camera={scale:scale,x:(viewport.clientWidth-W*scale)/2,y:(viewport.clientHeight-H*scale)/2};paint();}
  function focusMark(record){var scale=Math.max(camera.scale,.85);camera={scale:scale,x:viewport.clientWidth/2-(record.position.x+record.el.offsetWidth/2)*scale,y:viewport.clientHeight/2-(record.position.y+record.el.offsetHeight/2)*scale};paint();}
  function zoom(factor){var scale=Math.max(.2,Math.min(2,camera.scale*factor)),cx=viewport.clientWidth/2,cy=viewport.clientHeight/2;camera.x=cx-(cx-camera.x)*scale/camera.scale;camera.y=cy-(cy-camera.y)*scale/camera.scale;camera.scale=scale;paint();}
  function select(record){
    selected=record;records.forEach(function(r){r.el.classList.toggle('is-selected',r===record);r.el.setAttribute('aria-pressed',String(r===record));});
    document.querySelectorAll('[data-board-rotate]').forEach(function(b){b.disabled=!record;});
    if(record)record.el.style.zIndex=++z;
  }
  function remember(record,old){history.push({id:record.id,position:copy(old)});if(history.length>50)history.shift();document.getElementById('boardUndo').disabled=false;}
  function save(record){
    var position=copy(record.position);pending.add(record.id);
    var task=(queues.get(record.id)||Promise.resolve()).then(async function(){
      try{var response=await fetch('/api/notes',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:record.id,position:position})});if(!response.ok)throw Error();status.textContent='Position saved on the shared canvas.';}
      catch(_){status.textContent='This move could not be saved. Move the mark again to retry.';}
    });
    queues.set(record.id,task);task.finally(function(){if(queues.get(record.id)===task){pending.delete(record.id);queues.delete(record.id);}});
  }
  function render(note,index){
    if(records.has(note.id))return records.get(note.id);
    var el=document.createElement('div');el.dataset.noteId=note.id;el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-pressed','false');
    el.className='board-item '+(note.sticker?'board-sticker':note.stamp?'board-stamp':'pinned-note')+(note.seed?'':' visitor-note');
    el.style.setProperty('--note-color',colors[note.color]||colors.butter);
    if(note.sticker){el.textContent=note.sticker;el.setAttribute('aria-label',(note.label||'Visitor sticker')+'. Move with arrow keys.');}
    else if(note.stamp){el.innerHTML='<span>YOU WERE<br>HERE</span><span aria-hidden="true">✳</span>';el.setAttribute('aria-label','You were here stamp. Move with arrow keys.');}
    else{
      var pin=document.createElement('span');pin.className='note-pin';pin.setAttribute('aria-hidden','true');el.append(pin);
      if(note.strokes&&note.strokes.length){var drawing=svg('svg',{viewBox:'0 0 520 320',role:'img','aria-label':'A doodle by '+(note.name||'a visitor')});note.strokes.forEach(function(stroke){drawing.append(svg('polyline',{points:stroke.map(function(p){return p.join(',');}).join(' '),fill:'none',stroke:'#34352b','stroke-width':3,'stroke-linecap':'round','stroke-linejoin':'round'}));});el.append(drawing);}
      else{var text=document.createElement('p');text.textContent=note.text;el.append(text);}
      var footer=document.createElement('footer'),author=document.createElement('span'),date=document.createElement('span');author.textContent=note.name||'A curious visitor';date.textContent=note.caption||(note.createdAt?new Date(note.createdAt).toLocaleDateString('en',{month:'short',day:'numeric'}):'');footer.append(author,date);el.append(footer);
      el.setAttribute('aria-label',(note.name||'A visitor')+': '+(note.text||'Doodle')+'. Move with arrow keys.');
    }
    el.setAttribute('aria-label',(note.stamp?'YOU WERE HERE':el.textContent.replace(/\s+/g,' ').trim())+'. '+(note.strokes?.length?'Doodle. ':'')+'Move with arrow keys.');
    world.append(el);
    var slots=[[560,290],[860,390],[320,520],[960,620],[630,540],[230,390]];
    var point=slots[index%slots.length]||slots[0],record={id:note.id,el:el,seed:!!note.seed,position:null};records.set(note.id,record);
    place(record,note.position||{x:point[0]+Math.floor(index/6)*12,y:point[1],rotation:index%2?3:-3});
    el.addEventListener('keydown',function(e){
      if(e.key==='Enter'||e.key===' '){e.preventDefault();select(record);focusMark(record);return;}
      if(e.key==='Escape'){select(null);fit();return;}
      if(!/^Arrow/.test(e.key))return;e.preventDefault();select(record);var old=copy(record.position),step=e.shiftKey?25:8;
      var p=copy(old);if(e.key==='ArrowLeft')p.x-=step;if(e.key==='ArrowRight')p.x+=step;if(e.key==='ArrowUp')p.y-=step;if(e.key==='ArrowDown')p.y+=step;
      remember(record,old);place(record,p);clearTimeout(keyTimers.get(record.id));keyTimers.set(record.id,setTimeout(function(){keyTimers.delete(record.id);save(record);},220));
    });
    return record;
  }
  [
    {id:'host-note',name:'Srinidhi',text:'Good things happen when curious people cross paths.',caption:'the first pin ↗',color:'butter',position:{x:210,y:190,rotation:-4}},
    {id:'starter-welcome',name:'Your turn ↗',text:'Make yourself at home.\nThis corner is yours.',color:'rose',position:{x:900,y:540,rotation:4}},
    {id:'starter-smile',sticker:'🙂',label:'Starter smile',position:{x:455,y:130,rotation:-8}},
    {id:'starter-lotus',sticker:'🪷',label:'Starter lotus',position:{x:995,y:170,rotation:8}},
    {id:'starter-heart',sticker:'💛',label:'Starter heart',position:{x:785,y:460,rotation:-12}},
    {id:'starter-sparkles',sticker:'✨',label:'Starter sparkles',position:{x:690,y:630,rotation:6}},
    {id:'starter-palm',sticker:'🌴',label:'Starter palm',position:{x:155,y:565,rotation:-5}},
    {id:'starter-flower',sticker:'🌻',label:'Starter sunflower',position:{x:430,y:625,rotation:5}},
    {id:'starter-stamp',stamp:true,position:{x:1100,y:330,rotation:-8}}
  ].forEach(function(note,i){note.seed=true;render(note,i);});
  async function load(){
    if(gesture||pending.size||keyTimers.size||posting)return;
    try{var response=await fetch('/api/notes');if(!response.ok)throw Error();var data=await response.json();if(gesture||pending.size||keyTimers.size||posting)return;
      data.notes.forEach(function(note,i){render(note,i);});
      Object.keys(data.layout||{}).forEach(function(id){var r=records.get(id);if(r)place(r,data.layout[id]);});
      status.textContent=data.notes.length+' visitor '+(data.notes.length===1?'mark':'marks')+' · a shared canvas, open to everyone.';
    }catch(_){status.textContent='The shared board is resting. Your existing marks are safe; try again shortly.';}
  }
  async function add(payload){
    var cx=(viewport.clientWidth/2-camera.x)/camera.scale,cy=(viewport.clientHeight/2-camera.y)/camera.scale;
    payload.position={x:Math.max(20,Math.min(1150,cx-100+(Math.random()-.5)*100)),y:Math.max(20,Math.min(600,cy-100+(Math.random()-.5)*90)),rotation:(Math.random()-.5)*8};
    var response=await fetch('/api/notes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}),data=await response.json();
    if(!response.ok)throw Error(data.error||'Your mark could not be saved. Try again shortly.');
    var record=render(data.note,records.size);select(record);focusMark(record);status.textContent=payload.sticker?'Your sticker is on the board.':'Your little piece is here. Thanks for stopping by.';
    if(!reduced.matches&&record.el.animate)record.el.animate([{opacity:0},{opacity:1}],{duration:250});
    return data.note;
  }
  window.VisitorCanvas={add:add};
  viewport.addEventListener('pointerdown',function(e){
    if(e.button!==0||gesture)return;
    var item=e.target.closest('.board-item'),record=item&&records.get(item.dataset.noteId);
    if(tool==='move'&&record){select(record);record.el.focus({preventScroll:true});}
    else select(null);
    gesture={id:e.pointerId,kind:tool==='move'&&record?'item':'pan',record:record,x:e.clientX,y:e.clientY,original:record?copy(record.position):null,camera:{x:camera.x,y:camera.y},moved:false};
    viewport.setPointerCapture(e.pointerId);viewport.classList.add('is-moving');
  });
  viewport.addEventListener('pointermove',function(e){
    if(!gesture||gesture.id!==e.pointerId)return;var dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
    if(Math.abs(dx)+Math.abs(dy)<4&&!gesture.moved)return;gesture.moved=true;e.preventDefault();
    if(gesture.kind==='item')place(gesture.record,{x:gesture.original.x+dx/camera.scale,y:gesture.original.y+dy/camera.scale,rotation:gesture.original.rotation});
    else{camera.x=gesture.camera.x+dx;camera.y=gesture.camera.y+dy;paint();}
  });
  function release(e){if(!gesture||gesture.id!==e.pointerId)return;var old=gesture;gesture=null;viewport.classList.remove('is-moving');if(viewport.hasPointerCapture(e.pointerId))viewport.releasePointerCapture(e.pointerId);if(old.moved&&old.kind==='item'){remember(old.record,old.original);save(old.record);}}
  viewport.addEventListener('pointerup',release);viewport.addEventListener('pointercancel',release);viewport.addEventListener('lostpointercapture',release);
  viewport.addEventListener('wheel',function(e){if(e.ctrlKey||e.metaKey){e.preventDefault();e.stopPropagation();zoom(e.deltaY>0?1/1.08:1.08);}},{passive:false});
  viewport.addEventListener('dragstart',function(e){e.preventDefault();});
  document.querySelectorAll('[data-board-tool]').forEach(function(button){button.addEventListener('click',function(){tool=button.dataset.boardTool;document.querySelectorAll('[data-board-tool]').forEach(function(b){b.setAttribute('aria-pressed',String(b===button));});viewport.dataset.tool=tool;});});
  document.getElementById('boardZoomIn').addEventListener('click',function(){zoom(1.2);});document.getElementById('boardZoomOut').addEventListener('click',function(){zoom(1/1.2);});document.getElementById('boardFit').addEventListener('click',fit);
  document.querySelectorAll('[data-board-rotate]').forEach(function(b){b.addEventListener('click',function(){if(!selected)return;var old=copy(selected.position);remember(selected,old);place(selected,{x:old.x,y:old.y,rotation:old.rotation+Number(b.dataset.boardRotate)});save(selected);});});
  document.getElementById('boardUndo').addEventListener('click',function(){var last=history.pop();if(!last)return;clearTimeout(keyTimers.get(last.id));keyTimers.delete(last.id);var record=records.get(last.id);place(record,last.position);select(record);save(record);this.disabled=!history.length;});
  function closePalette(){palette.hidden=true;stickerButton.setAttribute('aria-expanded','false');}
  stickerButton.addEventListener('click',function(){palette.hidden=!palette.hidden;stickerButton.setAttribute('aria-expanded',String(!palette.hidden));});
  stickers.forEach(function(s){var b=document.createElement('button');b.type='button';b.textContent=s[0];b.setAttribute('aria-label','Add '+s[1].toLowerCase()+' sticker');b.addEventListener('click',async function(){if(posting)return;posting=true;palette.querySelectorAll('button').forEach(function(button){button.disabled=true;});try{await add({name:'',text:'',color:'butter',strokes:[],sticker:s[0]});closePalette();}catch(error){status.textContent=error.message;}finally{posting=false;palette.querySelectorAll('button').forEach(function(button){button.disabled=false;});}});palette.append(b);});
  document.addEventListener('click',function(e){if(!palette.contains(e.target)&&!stickerButton.contains(e.target))closePalette();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closePalette();});
  var lastWidth=0;
  function resize(){if(viewport.clientWidth!==lastWidth){lastWidth=viewport.clientWidth;fit();if(viewport.clientWidth<600){camera.scale=.65;camera.x=viewport.clientWidth/2-385*camera.scale;camera.y=viewport.clientHeight/2-365*camera.scale;paint();}}}
  new ResizeObserver(resize).observe(viewport);resize();load();
  new IntersectionObserver(function(entries){visible=entries[0].isIntersecting;}).observe(viewport);
  setInterval(function(){if(visible&&!document.hidden)load();},20000);
})();
