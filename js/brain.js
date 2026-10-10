/* A map of the person as well as the portfolio. Nodes can be picked up and explored. */
(function(){
  'use strict';
  var map=window.BRAIN_MAP,graph=document.getElementById('brainGraph');if(!map||!graph)return;
  var nodes=map.nodes,links=map.links,topics=map.topics,byID=new Map(nodes.map(function(n){return[n.id,n];}));
  var detail=document.getElementById('brainDetail'),list=document.getElementById('brainList'),search=document.getElementById('brainSearch');
  var trail=document.getElementById('brainTrail'),nav=document.getElementById('brainTopics'),status=document.getElementById('brainStatus'),tip=document.getElementById('brainTooltip');
  var back=document.getElementById('brainBack'),motion=document.getElementById('brainMotion'),view=document.getElementById('brainView');
  var plus=document.getElementById('brainZoomIn'),minus=document.getElementById('brainZoomOut'),reset=document.getElementById('brainReset');
  var preference=window.matchMedia('(prefers-reduced-motion: reduce)'),staticMode=/[?&]static/.test(location.search),ns='http://www.w3.org/2000/svg';
  var selected='me',scope='',query='',history=[],listMode=false,motionEnabled=true,inView=false,raf=0,lastFrame=0,gesture=null,hovered='',focused='';
  var width=1300,height=790,mobile=false,camera={x:0,y:0,scale:1},visible=new Set(),positions=new Map(),elements=new Map(),edges=[],branches=[],plan,geometry=new Map();
  var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
  function svg(tag,attrs){var el=document.createElementNS(ns,tag);Object.keys(attrs).forEach(function(k){el.setAttribute(k,attrs[k]);});return el;}
  function kind(n){return{case:'Design study',product:'Built product',role:'Volunteer role',pillar:'Yuva’s six pillars',place:'Home',interest:'Writing identity',topic:'A part of me',person:'Design engineer'}[n.kind];}
  function related(id){return links.filter(function(l){return l.from===id||l.to===id;}).map(function(l){return{node:byID.get(l.from===id?l.to:l.from),reason:l.reason};});}
  function items(){return nodes.filter(function(n){return n.topic&&(!scope||n.topic===scope)&&(!query||[n.name,n.desc,n.tags,(n.stack||[]).join(' '),byID.get(n.topic).name].join(' ').toLowerCase().includes(query.toLowerCase()));});}
  var defs=svg('defs',{}),clip=svg('clipPath',{id:'brainFaceClip'});clip.append(svg('circle',{r:42}));defs.append(clip);graph.append(defs);
  var scene=svg('g',{}),edgeLayer=svg('g',{'aria-hidden':'true'});scene.append(edgeLayer);graph.append(scene);
  nodes.forEach(function(n){
    var g=svg('g',{class:'brain-node','data-node':n.id,role:'button',tabindex:'0','aria-label':'Explore '+n.name,'aria-pressed':'false'});
    var color=n.color||(n.topic?byID.get(n.topic).color:'#794758');g.style.setProperty('--node-color',color);
    if(n.id==='me'){
      g.append(svg('circle',{r:51,class:'brain-self-ring'}));
      g.append(svg('circle',{r:43,class:'brain-self-paper'}));
      g.append(svg('image',{href:'assets/img/about-portrait.webp',x:-84,y:-38,width:168,height:155,'clip-path':'url(#brainFaceClip)','aria-hidden':'true'}));
      var self=svg('text',{'text-anchor':'middle',y:77,class:'node-name'});self.textContent='Srinidhi';g.append(self);
    }else{
      g.append(svg('rect',{rx:n.kind==='topic'?16:10,class:'node-paper'}));
      var label=svg('text',{'text-anchor':'middle',class:'node-name'});label.textContent=n.name;g.append(label);
      if(n.kind==='topic'){var count=svg('text',{'text-anchor':'middle',class:'node-count'});count.textContent=n.count+' connections';g.append(count);}
    }
    g.setAttribute('aria-description',n.desc);scene.append(g);elements.set(n.id,g);
    g.addEventListener('click',function(e){if(e.detail===0)choose(n.id);});
    g.addEventListener('keydown',function(e){
      if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(n.id);return;}
      if(e.key==='Escape'){e.preventDefault();choose('me');elements.get('me').focus({preventScroll:true});return;}
      var directions={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]},d=directions[e.key];if(!d)return;e.preventDefault();
      var p=positions.get(n.id);
      if(e.shiftKey){moveNode(n.id,p.tx+d[0]*16,p.ty+d[1]*16);paint();return;}
      var candidates=Array.from(visible).filter(function(id){return id!==n.id;}).map(function(id){var q=positions.get(id),dx=q.x-p.x,dy=q.y-p.y;return{id:id,forward:dx*d[0]+dy*d[1],distance:Math.hypot(dx,dy)+Math.abs(dx*d[1]-dy*d[0])*2};}).filter(function(c){return c.forward>1;}).sort(function(a,b){return a.distance-b.distance;});
      if(candidates.length)elements.get(candidates[0].id).focus({preventScroll:true});
    });
    g.addEventListener('mouseenter',function(e){hovered=n.id;showTip(n,e);highlight();});
    g.addEventListener('mouseleave',function(){hovered='';tip.hidden=true;highlight();});
    g.addEventListener('focus',function(){focused=g.matches(':focus-visible')?n.id:'';if(focused)ensureVisible(n.id);highlight();});
    g.addEventListener('blur',function(){focused='';highlight();});
  });
  function showTip(n,e){if(gesture)return;var r=graph.parentElement.getBoundingClientRect();tip.innerHTML='<strong>'+esc(n.name)+'</strong><span>'+esc(kind(n))+'</span><p>'+esc(n.desc.length>145?n.desc.slice(0,142)+'…':n.desc)+'</p>';tip.hidden=false;tip.style.left=Math.max(8,Math.min(r.width-252,e.clientX-r.left+15))+'px';tip.style.top=Math.max(8,Math.min(r.height-140,e.clientY-r.top+18))+'px';}
  nav.innerHTML='<button type="button" data-brain-topic="me">Overview</button>'+topics.map(function(t){return'<button type="button" data-brain-topic="'+t.id+'">'+esc(t.name)+'<span>'+t.count+'</span></button>';}).join('');
  nav.querySelectorAll('button').forEach(function(b){b.addEventListener('click',function(){choose(b.dataset.brainTopic);});});
  function measureLabels(){
    visible.forEach(function(id){
      if(id==='me'){geometry.set(id,{w:102,h:102});return;}
      var n=byID.get(id),el=elements.get(id),label=el.querySelector('.node-name');
      var maxWidth=n.kind==='topic'?(mobile?212:252):mobile?208:plan.mode==='overview'?190:260;
      var lines=[''];label.replaceChildren();var probe=svg('tspan',{});label.append(probe);
      n.name.split(' ').forEach(function(word){var i=lines.length-1,value=(lines[i]+' '+word).trim();probe.textContent=value;if(probe.getComputedTextLength()>maxWidth-34&&lines[i])lines.push(word);else lines[i]=value;});
      label.replaceChildren();var textWidth=0,lineHeight=mobile?22:23;
      lines.forEach(function(line,i){var span=svg('tspan',{x:0,dy:i?lineHeight:0});span.textContent=line;label.append(span);textWidth=Math.max(textWidth,span.getComputedTextLength());});
      var boxWidth=Math.max(n.kind==='topic'?maxWidth:116,Math.min(maxWidth,textWidth+36));
      var boxHeight=n.kind==='topic'?Math.max(mobile?96:65,lines.length*lineHeight+42):Math.max(mobile?84:47,lines.length*lineHeight+24);
      label.setAttribute('y',n.kind==='topic'?-((lines.length-1)*lineHeight)/2-5:6-((lines.length-1)*lineHeight)/2);
      var count=el.querySelector('.node-count');if(count)count.setAttribute('y',boxHeight/2-15);
      var rect=el.querySelector('.node-paper');rect.setAttribute('x',-boxWidth/2);rect.setAttribute('y',-boxHeight/2);rect.setAttribute('width',boxWidth);rect.setAttribute('height',boxHeight);
      geometry.set(id,{w:boxWidth,h:boxHeight});
    });
  }
  function moveNode(id,x,y){var p=positions.get(id),size=geometry.get(id)||{w:102,h:102};p.x=p.tx=Math.max(size.w/2+8,Math.min(width-size.w/2-8,x));p.y=p.ty=Math.max(size.h/2+12,Math.min(height-size.h/2-30,y));p.pinned=true;}
  function layout(clear){
    mobile=window.innerWidth<=600;var found=items();
    plan=window.createBrainLayout(map,{mobile:mobile,scope:scope,query:query,selected:selected,found:found});
    width=plan.width;height=plan.height;var next=plan.points;
    graph.dataset.mode=plan.mode;
    edgeLayer.replaceChildren();edges=[];branches=[];
    plan.groups.forEach(function(group){var path=svg('path',{class:'brain-edge brain-branch'});edgeLayer.append(path);branches.push({el:path,group:group});});
    plan.edges.forEach(function(link){var path=svg('path',{class:'brain-edge','data-from':link.from,'data-to':link.to});edgeLayer.append(path);edges.push({el:path,link:link});});
    visible=new Set(next.keys());next.forEach(function(p,id){var old=positions.get(id);if(!old||clear)old={x:p.x,y:p.y,tx:p.x,ty:p.y,pinned:false};else if(!old.pinned){old.x=old.tx=p.x;old.y=old.ty=p.y;}positions.set(id,old);});
    elements.forEach(function(el,id){var show=visible.has(id);el.style.display=show?'':'none';el.setAttribute('aria-hidden',String(!show));el.setAttribute('tabindex',show?'0':'-1');el.classList.toggle('is-cluster',byID.get(id).kind==='topic');el.classList.toggle('is-person',id==='me');});
    measureLabels();
    graph.setAttribute('viewBox','0 0 '+width+' '+height);graph.style.aspectRatio=width+' / '+height;
    nav.querySelectorAll('button').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.brainTopic===(scope||'me')));});
    document.getElementById('brainClear').hidden=!query;document.getElementById('brainEmpty').hidden=!query||found.length>0||listMode;
    function total(count){return count+' '+(count===1?'connection':'connections');}
    status.textContent=query?total(found.length)+' found':plan.mode==='connection'?byID.get(selected).name+' · '+total(related(selected).length):scope?total(found.length)+' in '+byID.get(scope).name.toLowerCase():'Four themes. '+nodes.filter(function(n){return n.kind==='product'||n.kind==='case';}).length+' projects. Start with a branch.';
    document.getElementById('brainHint').textContent='Select to explore. Drag to rearrange. Shift + arrows move a focused node.';
    highlight();paint();renderList(found);syncMotion();document.dispatchEvent(new CustomEvent('portfolio:layout'));
  }
  function highlight(){
    var id=hovered||focused||selected,adjacent=new Set(related(id).map(function(r){return r.node.id;}));
    elements.forEach(function(el,nodeID){el.classList.toggle('is-active',nodeID===selected);el.setAttribute('aria-pressed',String(nodeID===selected));el.classList.toggle('is-neighbor',adjacent.has(nodeID));el.classList.toggle('is-dim',id!=='me'&&nodeID!==id&&!adjacent.has(nodeID));});
    edges.forEach(function(edge){var l=edge.link;edge.el.classList.toggle('connected',l.from===id||l.to===id);edge.el.classList.toggle('is-muted',id!=='me'&&l.from!==id&&l.to!==id);});
    branches.forEach(function(branch){var group=branch.group;branch.el.classList.toggle('connected',group.from===id||group.children.includes(id));branch.el.classList.toggle('is-muted',id!=='me'&&group.from!==id&&!group.children.includes(id));});
  }
  function paint(now){
    var drift=shouldMove()&&!gesture&&!hovered&&!focused,t=(now||performance.now())/1000,points={};
    visible.forEach(function(id){var p=positions.get(id),i=nodes.indexOf(byID.get(id));if(!gesture||gesture.node!==id){p.x+=(p.tx-p.x)*.2;p.y+=(p.ty-p.y)*.2;}points[id]={x:p.x+(drift&&id!=='me'&&!p.pinned?Math.sin(t/5+i*1.5)*3:0),y:p.y+(drift&&id!=='me'&&!p.pinned?Math.cos(t/6+i)*3:0)};elements.get(id).setAttribute('transform','translate('+points[id].x.toFixed(2)+' '+points[id].y.toFixed(2)+')');});
    function anchor(id,toward){var p=points[id],size=geometry.get(id)||{w:100,h:100};var dx=toward.x-p.x,dy=toward.y-p.y;if(id==='me'){if(dy>0&&dy>Math.abs(dx)*.6)return{x:p.x,y:p.y+98};var len=Math.hypot(dx,dy)||1;return{x:p.x+dx/len*51,y:p.y+dy/len*51};}var ratio=1/Math.max(Math.abs(dx)/(size.w/2),Math.abs(dy)/(size.h/2),.001);return{x:p.x+dx*ratio,y:p.y+dy*ratio};}
    branches.forEach(function(branch){var group=branch.group,a=points[group.from];if(!a)return;var start=anchor(group.from,{x:a.x,y:group.top});var bottom=Math.max.apply(null,group.children.map(function(id){return points[id].y;}));branch.el.setAttribute('d','M'+start.x+' '+start.y+' V'+group.top+' H'+group.lane+' V'+bottom);});
    edges.forEach(function(edge){var l=edge.link,a=points[l.from],b=points[l.to];if(!a||!b)return;
      if(l.lane!==undefined){var end=anchor(l.to,{x:l.lane,y:b.y});edge.el.setAttribute('d','M'+l.lane+' '+b.y+' H'+end.x);}
      else {var start=anchor(l.from,b),end=anchor(l.to,a),dx=end.x-start.x,dy=end.y-start.y;edge.el.setAttribute('d','M'+start.x+' '+start.y+' C'+(start.x+dx*.2)+' '+(start.y+dy*.7)+' '+(end.x-dx*.2)+' '+(end.y-dy*.7)+' '+end.x+' '+end.y);}
    });
    scene.setAttribute('transform','translate('+camera.x+' '+camera.y+') scale('+camera.scale+')');plus.disabled=camera.scale>=2.5;minus.disabled=camera.scale<=.65;
  }
  function renderList(found){list.innerHTML=topics.map(function(t){var group=found.filter(function(n){return n.topic===t.id;});return group.length?'<section class="brain-list-group"><h3>'+esc(t.name)+' <span>'+group.length+'</span></h3>'+group.map(function(n){return'<button type="button" data-list-node="'+n.id+'" aria-pressed="'+(n.id===selected)+'"><span><strong>'+esc(n.name)+'</strong><small>'+kind(n)+'</small></span><span aria-hidden="true">↗</span></button>';}).join('')+'</section>':'';}).join('')||'<p class="brain-no-results">No connections found. Try a project, an interest, or a Yuva pillar.</p>';list.querySelectorAll('[data-list-node]').forEach(function(b){b.addEventListener('click',function(){choose(b.dataset.listNode);});});}
  function renderDetail(){
    var n=byID.get(selected),topic=n.topic&&byID.get(n.topic),connections=related(n.id).filter(function(r){return r.node.id!=='me'&&r.node.id!==n.topic;});
    if(n.kind==='topic')connections=connections.slice(0,5);
    var title=n.id==='me'?'Srinidhi Bhat':n.name,meta=n.tags||(n.stack||[]).join(' · ');
    detail.innerHTML='<div class="brain-selected"><span class="detail-index">'+esc(n.id==='me'?'THE PERSON BEHIND THE PROJECTS':kind(n)+(topic?' · '+topic.name:''))+'</span><h3 tabindex="-1">'+esc(title)+'</h3>'+(n.thumb?'<img class="brain-project-image" src="'+esc(n.thumb)+'" alt="'+esc(n.name)+' preview" loading="lazy">':'')+'<p>'+esc(n.desc)+'</p>'+(meta?'<p class="brain-project-meta">'+esc(meta)+'</p>':'')+(n.href?'<a class="text-button brain-project-action" href="'+esc(n.href)+'" target="_blank" rel="noopener">'+esc(n.cta)+' <span aria-hidden="true">↗</span></a>':n.caseSlug?'<button type="button" class="text-button brain-project-action" id="brainCase">Explore case study <span aria-hidden="true">↗</span></button>':'')+'</div><div class="brain-related"><h4>'+(n.id==='me'?'Four parts of me':n.id==='yuva-volunteer'?'Yuva & its six pillars':'Follow a connection')+'</h4><div class="detail-links">'+connections.map(function(r){return'<button type="button" data-connection="'+r.node.id+'"><span><strong>'+esc(r.node.name)+'</strong><small>'+esc(r.reason)+'</small></span><span aria-hidden="true">↗</span></button>';}).join('')+'</div>'+(n.kind==='topic'?'<button type="button" class="brain-browse-topic">Browse all '+n.count+' connections <span aria-hidden="true">↗</span></button>':'')+'</div>';
    detail.querySelectorAll('[data-connection]').forEach(function(b){b.addEventListener('click',function(){choose(b.dataset.connection);});});
    var caseButton=document.getElementById('brainCase');if(caseButton)caseButton.addEventListener('click',function(){document.querySelector('.card[data-case="'+n.caseSlug+'"]').click();});
    var browse=detail.querySelector('.brain-browse-topic');if(browse)browse.addEventListener('click',function(){if(!listMode)toggleList();var b=list.querySelector('button');if(b)b.focus();});
    trail.innerHTML='<button type="button" data-trail="me">My brain</button>'+(topic?'<span aria-hidden="true">/</span><button type="button" data-trail="'+topic.id+'">'+esc(topic.name)+'</button>':'')+(n.topic?'<span aria-hidden="true">/</span><span aria-current="page">'+esc(n.name)+'</span>':'');
    trail.querySelectorAll('[data-trail]').forEach(function(b){b.addEventListener('click',function(){choose(b.dataset.trail);});});back.disabled=!history.length;
  }
  function choose(id,remember){
    if(!byID.has(id))return;var n=byID.get(id),active=document.activeElement,fromPanel=detail.contains(active)||trail.contains(active);
    if(id!==selected&&remember!==false)history.push({id:selected,scope:scope,camera:{x:camera.x,y:camera.y,scale:camera.scale}});selected=id;
    if(id==='me')scope='';else if(n.kind==='topic')scope=id;else scope=n.topic;
    query='';search.value='';if(remember!==false)camera={x:0,y:0,scale:1};tip.hidden=true;hovered='';focused='';renderDetail();layout(true);
    if(graph.contains(active)){var destination=elements.get(id);destination.focus({preventScroll:true});}
    if(fromPanel)detail.querySelector('h3').focus({preventScroll:true});
  }
  function ensureVisible(id){var p=positions.get(id);if(!p)return;var x=p.x*camera.scale+camera.x,y=p.y*camera.scale+camera.y;if(x<100||x>width-100||y<65||y>height-80){camera.x=width/2-p.x*camera.scale;camera.y=height/2-p.y*camera.scale;paint();}}
  function zoom(factor){var next=Math.max(.65,Math.min(2.5,camera.scale*factor));camera.x=width/2-(width/2-camera.x)*next/camera.scale;camera.y=height/2-(height/2-camera.y)*next/camera.scale;camera.scale=next;paint();}
  plus.addEventListener('click',function(){zoom(1.2);});minus.addEventListener('click',function(){zoom(1/1.2);});reset.addEventListener('click',function(){positions.clear();camera={x:0,y:0,scale:1};layout(true);});
  back.addEventListener('click',function(){if(!history.length)return;var previous=history.pop();scope=previous.scope;camera=previous.camera;choose(previous.id,false);});search.addEventListener('input',function(){scope='';query=search.value.trim();selected='me';camera={x:0,y:0,scale:1};renderDetail();layout(true);});
  document.getElementById('brainClear').addEventListener('click',function(){choose('me');search.focus();});
  search.addEventListener('keydown',function(e){if(e.key==='Escape')choose('me');});
  function toggleList(){listMode=!listMode;list.hidden=!listMode;graph.hidden=listMode;graph.style.display=listMode?'none':'';view.setAttribute('aria-pressed',String(listMode));view.textContent=listMode?'Show map':'Browse list';document.getElementById('brainHint').hidden=listMode;[plus,minus,motion,reset].forEach(function(b){b.hidden=listMode;});layout();}
  view.addEventListener('click',toggleList);graph.addEventListener('wheel',function(e){if(e.ctrlKey||e.metaKey){e.preventDefault();e.stopPropagation();zoom(e.deltaY>0?1/1.08:1.08);}},{passive:false});
  graph.addEventListener('pointerdown',function(e){
    if(e.button!==0||gesture)return;var node=e.target.closest('[data-node]'),id=node&&node.dataset.node;
    if(e.pointerType==='touch'&&!id)return;var p=id&&positions.get(id);gesture={id:e.pointerId,node:id,px:e.clientX,py:e.clientY,x:p?p.x:camera.x,y:p?p.y:camera.y,moved:false};tip.hidden=true;hovered='';graph.setPointerCapture(e.pointerId);graph.classList.add('is-dragging');
  });
  graph.addEventListener('pointermove',function(e){
    if(!gesture||e.pointerId!==gesture.id)return;var matrix=graph.getScreenCTM();if(!matrix)return;var dx=(e.clientX-gesture.px)/matrix.a,dy=(e.clientY-gesture.py)/matrix.d;
    if(Math.abs(e.clientX-gesture.px)+Math.abs(e.clientY-gesture.py)>5)gesture.moved=true;if(!gesture.moved)return;e.preventDefault();
    if(gesture.node){moveNode(gesture.node,gesture.x+dx/camera.scale,gesture.y+dy/camera.scale);}
    else{camera.x=gesture.x+dx;camera.y=gesture.y+dy;}paint();
  });
  function release(e){if(!gesture||gesture.id!==e.pointerId)return;var old=gesture;gesture=null;graph.classList.remove('is-dragging');if(graph.hasPointerCapture(e.pointerId))graph.releasePointerCapture(e.pointerId);if(old.node&&!old.moved&&e.type==='pointerup')choose(old.node);else paint();}
  graph.addEventListener('pointerup',release);graph.addEventListener('pointercancel',release);graph.addEventListener('lostpointercapture',release);graph.addEventListener('dragstart',function(e){e.preventDefault();});
  function shouldMove(){return motionEnabled&&!preference.matches&&!staticMode&&inView&&!document.hidden&&!listMode;}
  function frame(now){raf=0;if(!shouldMove())return;if(now-lastFrame>33){paint(now);lastFrame=now;}raf=requestAnimationFrame(frame);}
  function syncMotion(){motion.disabled=preference.matches||staticMode;motion.setAttribute('aria-pressed',String(!motionEnabled||motion.disabled));motion.textContent=motion.disabled?'Motion off':motionEnabled?'Pause motion':'Resume motion';if(shouldMove()){if(!raf)raf=requestAnimationFrame(frame);}else{if(raf)cancelAnimationFrame(raf);raf=0;paint();}}
  motion.addEventListener('click',function(){motionEnabled=!motionEnabled;syncMotion();});document.addEventListener('visibilitychange',syncMotion);preference.addEventListener('change',syncMotion);
  new IntersectionObserver(function(entries){inView=entries[0].isIntersecting;syncMotion();}).observe(graph);
  window.addEventListener('resize',function(){if(mobile!==(window.innerWidth<=600)){positions.clear();camera={x:0,y:0,scale:1};layout(true);}});
  renderDetail();layout(true);
  document.fonts.ready.then(function(){measureLabels();paint();});
})();
