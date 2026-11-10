/* A flat network graph. Every dot is a real project, interest or role and every line a real connection. */
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
  // The layout is settled once, inside a circle, and then stays put; dragging turns the whole disc.
  let yaw = 0, pitch = 0, velocity = 0, targetRotation = null;
  const palette = ['#e4ad91','#a99edf','#81c6bc','#e3c889'];
  const vectors = new Map(), projected = new Map();
  const degree = new Map(nodes.map(n=>[n.id,0]));
  links.forEach(l=>{degree.set(l.from,degree.get(l.from)+1);degree.set(l.to,degree.get(l.to)+1);});
  // Dots grow with their number of connections, as in a notes graph.
  function size(n){return n.id==='me'?9:n.kind==='topic'?6.5:2.6+Math.min(3.4,Math.sqrt(degree.get(n.id))*.9);}
  function rotate([x,y]) {
    const c=Math.cos(yaw), s=Math.sin(yaw);
    return [x*c-y*s, x*s+y*c];
  }
  function project(point) {
    const [x,y] = rotate(point), radius = Math.min(width,height)/2 - (mobile?52:58);
    return {x:width/2+x*radius,y:height/2+y*radius,z:0,scale:1};
  }
  // Seed each theme in its own quarter, then let connected dots pull together and all dots push apart.
  vectors.set('me',[0,0]);
  topics.forEach((topic,index)=>{
    const angle=index*Math.PI/2+.6;
    vectors.set(topic.id,[Math.cos(angle)*.42,Math.sin(angle)*.42]);
    nodes.filter(n=>n.topic===topic.id).forEach((node,i,group)=>{
      const spread=angle+(i-(group.length-1)/2)*(1.35/Math.max(1,group.length)), reach=.62+.3*((i*7)%5)/5;
      vectors.set(node.id,[Math.cos(spread)*reach,Math.sin(spread)*reach]);
    });
  });
  for(let step=0;step<320;step++){
    const push=new Map(nodes.map(n=>[n.id,[0,0]])), cool=.05*(1-step/320)+.004;
    nodes.forEach((a,i)=>{
      for(let k=i+1;k<nodes.length;k++){
        const b=nodes[k],p=vectors.get(a.id),q=vectors.get(b.id);
        let dx=p[0]-q[0],dy=p[1]-q[1];const d=Math.hypot(dx,dy)||.001,f=.012/(d*d);
        dx=dx/d*f;dy=dy/d*f;
        push.get(a.id)[0]+=dx;push.get(a.id)[1]+=dy;push.get(b.id)[0]-=dx;push.get(b.id)[1]-=dy;
      }
    });
    links.forEach(l=>{
      const p=vectors.get(l.from),q=vectors.get(l.to),dx=q[0]-p[0],dy=q[1]-p[1],d=Math.hypot(dx,dy)||.001,f=(d-.26)*.9;
      push.get(l.from)[0]+=dx/d*f;push.get(l.from)[1]+=dy/d*f;push.get(l.to)[0]-=dx/d*f;push.get(l.to)[1]-=dy/d*f;
    });
    nodes.forEach(n=>{
      if(n.id==='me')return;
      const p=vectors.get(n.id),m=push.get(n.id),len=Math.hypot(m[0],m[1])||1,move=Math.min(cool,len);
      p[0]+=m[0]/len*move-p[0]*.004;p[1]+=m[1]/len*move-p[1]*.004;
    });
  }
  // Fit the settled network inside a unit circle.
  const reach=Math.max(...nodes.map(n=>Math.hypot(...vectors.get(n.id))));
  nodes.forEach(n=>{const p=vectors.get(n.id);p[0]/=reach;p[1]/=reach;});
  const ring=svg('circle',{class:'brain-ring',fill:'none','aria-hidden':'true'});
  scene.insertBefore(ring,edgeLayer);
  nodes.forEach(function(n){
    var g=svg('g',{class:'brain-node','data-node':n.id,role:'button',tabindex:'0','aria-label':'Explore '+n.name+(n.kind==='topic'?' '+n.count+' connections':''),'aria-pressed':'false'});
    var color=n.color||(n.topic?byID.get(n.topic).color:'#bc483b');g.style.setProperty('--node-color',color);
    const topicIndex=topics.findIndex(t=>t.id===(n.topic||n.id));
    g.style.setProperty('--node-color',palette[Math.max(0,topicIndex)]);
    g.append(svg('circle',{r:22,fill:'transparent',class:'node-hit'}));
    g.append(svg('circle',{r:size(n)+(n.id==='me'?9:n.kind==='topic'?6:3),class:'node-aura'}));
    g.append(svg('circle',{r:size(n),class:'node-core'}));
    const label=svg('text',{x:15,y:-12,class:'node-name'});label.textContent=n.id==='me'?'Srinidhi':n.name;g.append(label);
    g.setAttribute('aria-description',n.desc);scene.append(g);elements.set(n.id,g);
    g.addEventListener('click',function(e){if(e.detail===0)choose(n.id);});
    g.addEventListener('keydown',function(e){
      if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(n.id);return;}
      if(e.key==='Escape'){e.preventDefault();choose('me');elements.get('me').focus({preventScroll:true});return;}
      var directions={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]},d=directions[e.key];if(!d)return;e.preventDefault();
      var p=positions.get(n.id);
      var candidates=Array.from(visible).filter(function(id){return id!==n.id;}).map(function(id){var q=positions.get(id),dx=q.x-p.x,dy=q.y-p.y;return{id:id,forward:dx*d[0]+dy*d[1],distance:Math.hypot(dx,dy)+Math.abs(dx*d[1]-dy*d[0])*2};}).filter(function(c){return c.forward>1;}).sort(function(a,b){return a.distance-b.distance;});
      if(candidates.length)elements.get(candidates[0].id).focus({preventScroll:true});
    });
    g.addEventListener('mouseenter',function(e){hovered=n.id;showTip(n,e);highlight();paint();});
    g.addEventListener('mouseleave',function(){hovered='';tip.hidden=true;highlight();paint();});
    g.addEventListener('focus',function(){focused=g.matches(':focus-visible')?n.id:'';if(focused)ensureVisible(n.id);highlight();});
    g.addEventListener('blur',function(){focused='';highlight();});
  });
  function showTip(n,e){if(gesture)return;var r=graph.parentElement.getBoundingClientRect();tip.innerHTML='<strong>'+esc(n.name)+'</strong><span>'+esc(kind(n))+'</span><p>'+esc(n.desc.length>145?n.desc.slice(0,142)+'…':n.desc)+'</p>';tip.hidden=false;tip.style.left=Math.max(8,Math.min(r.width-252,e.clientX-r.left+15))+'px';tip.style.top=Math.max(8,Math.min(r.height-140,e.clientY-r.top+18))+'px';}
  nav.innerHTML='<button type="button" data-brain-topic="me">Overview</button>'+topics.map(function(t){return'<button type="button" data-brain-topic="'+t.id+'">'+esc(t.name)+'<span>'+t.count+'</span></button>';}).join('');
  nav.querySelectorAll('button').forEach(function(b){b.addEventListener('click',function(){choose(b.dataset.brainTopic);});});
  function layout(){
    mobile=window.innerWidth<=600;
    width=mobile?580:1000;height=mobile?620:690;
    const found=items();
    visible=new Set(nodes.map(n=>n.id));
    edgeLayer.replaceChildren();edges=[];
    links.forEach(link=>{
      const el=svg('path',{class:'brain-edge','data-from':link.from,'data-to':link.to});
      edgeLayer.append(el);edges.push({el,link});
    });
    nodes.forEach(n=>positions.set(n.id,{x:0,y:0}));
    graph.setAttribute('viewBox','0 0 '+width+' '+height);
    graph.style.aspectRatio=width+' / '+height;
    nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.brainTopic===(scope||'me'))));
    document.getElementById('brainClear').hidden=!query;
    document.getElementById('brainEmpty').hidden=!query||found.length>0||listMode;
    status.textContent=query?found.length+' connections found':nodes.length+' nodes · '+links.length+' connections';
    document.getElementById('brainHint').textContent='Drag to turn · Pinch or scroll to zoom · Select a dot';
    highlight();paint();renderList(found);syncMotion();
    document.dispatchEvent(new CustomEvent('portfolio:layout'));
  }
  function highlight(){
    var id=hovered||focused||selected,adjacent=new Set(related(id).map(function(r){return r.node.id;}));
    elements.forEach(function(el,nodeID){el.classList.toggle('is-active',nodeID===selected);el.setAttribute('aria-pressed',String(nodeID===selected));el.classList.toggle('is-neighbor',adjacent.has(nodeID));el.classList.toggle('is-dim',id!=='me'&&nodeID!==id&&!adjacent.has(nodeID));});
    edges.forEach(function(edge){var l=edge.link;edge.el.classList.toggle('connected',l.from===id||l.to===id);edge.el.classList.toggle('is-muted',id!=='me'&&l.from!==id&&l.to!==id);});
    branches.forEach(function(branch){var group=branch.group;branch.el.classList.toggle('connected',group.from===id||group.children.includes(id));branch.el.classList.toggle('is-muted',id!=='me'&&group.from!==id&&!group.children.includes(id));});
  }
  function paint(now){
    const delta=now?Math.min(50,now-lastFrame):0;
    if(targetRotation && !gesture){
      yaw+=(targetRotation.yaw-yaw)*.13;pitch+=(targetRotation.pitch-pitch)*.13;
      if(Math.abs(targetRotation.yaw-yaw)<.001)targetRotation=null;
    }else if(delta && !gesture && !hovered && !focused){
      yaw+=velocity;
      velocity*=.94;
    }
    ring.setAttribute('cx',width/2);ring.setAttribute('cy',height/2);ring.setAttribute('r',Math.min(width,height)/2-(mobile?22:26));
    const activeID=hovered||focused||selected,near=new Set(activeID==='me'?[]:related(activeID).map(r=>r.node.id));
    const matching=new Set(items().map(n=>n.id));
    nodes.forEach(n=>{
      const p=project(vectors.get(n.id)),el=elements.get(n.id);
      projected.set(n.id,p);positions.set(n.id,p);
      const relevant=(!scope||n.id===scope||n.topic===scope||n.id==='me')&&(!query||matching.has(n.id));
      el.setAttribute('transform','translate('+p.x+' '+p.y+') scale('+p.scale+')');
      el.style.opacity=relevant?(p.z<-.15?.45:1):.13;
      const labelled=n.kind==='topic'||n.id==='me'||n.id===selected||n.id===hovered||n.id===focused||near.has(n.id)||(query&&matching.has(n.id));
      el.classList.toggle('is-labelled',labelled);
      const label=el.querySelector('text');
      label.setAttribute('x',p.x>width*.7?-15:15);label.setAttribute('text-anchor',p.x>width*.7?'end':'start');
    });
    edges.forEach(({el,link})=>{
      const a=projected.get(link.from),b=projected.get(link.to);
      const active=link.from===activeID||link.to===activeID;
      el.setAttribute('d','M'+a.x.toFixed(1)+' '+a.y.toFixed(1)+'L'+b.x.toFixed(1)+' '+b.y.toFixed(1));
      el.style.opacity=active?.85:.24;
      el.style.stroke=palette[Math.max(0,topics.findIndex(t=>t.id===(byID.get(link.to).topic||link.to)))];
    });
    scene.setAttribute('transform','translate('+camera.x+' '+camera.y+') scale('+camera.scale+')');
    plus.disabled=camera.scale>=2.5;minus.disabled=camera.scale<=.65;
  }
  function renderList(found){list.innerHTML=topics.map(function(t){var group=found.filter(function(n){return n.topic===t.id;});return group.length?'<section class="brain-list-group"><h3>'+esc(t.name)+' <span>'+group.length+'</span></h3>'+group.map(function(n){return'<button type="button" data-list-node="'+n.id+'" aria-pressed="'+(n.id===selected)+'"><span><strong>'+esc(n.name)+'</strong><small>'+kind(n)+'</small></span><span aria-hidden="true">↗</span></button>';}).join('')+'</section>':'';}).join('')||'<p class="brain-no-results">No connections found. Try a project, an interest, or a Yuva pillar.</p>';list.querySelectorAll('[data-list-node]').forEach(function(b){b.addEventListener('click',function(){choose(b.dataset.listNode);});});}
  function renderDetail(){
    var n=byID.get(selected),topic=n.topic&&byID.get(n.topic),connections=related(n.id).filter(function(r){return r.node.id!=='me'&&r.node.id!==n.topic;});
    if(n.kind==='topic')connections=connections.slice(0,5);
    var title=n.id==='me'?'Srinidhi Bhat':n.name,meta=n.tags||(n.stack||[]).join(' · ');
    detail.innerHTML='<div class="brain-selected"><span class="detail-index">'+esc(n.id==='me'?'THE PERSON BEHIND THE PROJECTS':kind(n)+(topic?' · '+topic.name:''))+'</span><h3 tabindex="-1">'+esc(title)+'</h3>'+(n.thumb?'<img class="brain-project-image" src="'+esc(n.thumb)+'" alt="'+esc(n.name)+' preview" loading="lazy">':'')+'<p>'+esc(n.desc)+'</p>'+(meta?'<p class="brain-project-meta">'+esc(meta)+'</p>':'')+(n.href?'<a class="text-button brain-project-action" href="'+esc(n.href)+'" target="_blank" rel="noopener">'+esc(n.cta)+' <span aria-hidden="true">↗</span></a>':n.caseSlug?'<button type="button" class="text-button brain-project-action" id="brainCase">Explore case study <span aria-hidden="true">↗</span></button>':'')+'</div><div class="brain-related"><h4>'+(n.id==='me'?'Four parts of me':n.id==='yuva-volunteer'?'Yuva & its six pillars':'Follow a connection')+'</h4><div class="detail-links">'+connections.map(function(r){return'<button type="button" data-connection="'+r.node.id+'"><span><strong>'+esc(r.node.name)+'</strong><small>'+esc(r.reason)+'</small></span><span aria-hidden="true">↗</span></button>';}).join('')+'</div>'+(n.kind==='topic'?'<button type="button" class="brain-browse-topic">Browse all '+n.count+' connections <span aria-hidden="true">↗</span></button>':'')+'</div>';
    detail.querySelectorAll('[data-connection]').forEach(function(b){b.addEventListener('click',function(){choose(b.dataset.connection);});});
    var caseButton=document.getElementById('brainCase');if(caseButton)caseButton.addEventListener('click',function(){document.querySelector('.cover-card[data-case="'+n.caseSlug+'"]').click();});
    var browse=detail.querySelector('.brain-browse-topic');if(browse)browse.addEventListener('click',function(){if(!listMode)toggleList();var b=list.querySelector('button');if(b)b.focus();});
    trail.innerHTML='<button type="button" data-trail="me">My brain</button>'+(topic?'<span aria-hidden="true">/</span><button type="button" data-trail="'+topic.id+'">'+esc(topic.name)+'</button>':'')+(n.topic?'<span aria-hidden="true">/</span><span aria-current="page">'+esc(n.name)+'</span>':'');
    trail.querySelectorAll('[data-trail]').forEach(function(b){b.addEventListener('click',function(){choose(b.dataset.trail);});});back.disabled=!history.length;
  }
  function choose(id,remember){
    if(!byID.has(id))return;var n=byID.get(id),active=document.activeElement,fromPanel=detail.contains(active)||trail.contains(active);
    if(id!==selected&&remember!==false)history.push({id:selected,scope:scope,camera:{x:camera.x,y:camera.y,scale:camera.scale}});selected=id;
    if(id==='me')scope='';else if(n.kind==='topic')scope=id;else scope=n.topic;
    query='';search.value='';if(remember!==false)camera={x:0,y:0,scale:1};
    tip.hidden=true;hovered='';focused='';renderDetail();layout(true);
    if(graph.contains(active)){var destination=elements.get(id);destination.focus({preventScroll:true});}
    if(fromPanel)detail.querySelector('h3').focus({preventScroll:true});
  }
  function ensureVisible(id){var p=positions.get(id);if(!p)return;var x=p.x*camera.scale+camera.x,y=p.y*camera.scale+camera.y;if(x<100||x>width-100||y<65||y>height-80){camera.x=width/2-p.x*camera.scale;camera.y=height/2-p.y*camera.scale;paint();}}
  function zoom(factor){var next=Math.max(.65,Math.min(2.5,camera.scale*factor));camera.x=width/2-(width/2-camera.x)*next/camera.scale;camera.y=height/2-(height/2-camera.y)*next/camera.scale;camera.scale=next;paint();}
  plus.addEventListener('click',function(){zoom(1.2);});minus.addEventListener('click',function(){zoom(1/1.2);});reset.addEventListener('click',function(){yaw=0;pitch=0;velocity=0;targetRotation=null;positions.clear();camera={x:0,y:0,scale:1};layout(true);});
  back.addEventListener('click',function(){if(!history.length)return;var previous=history.pop();scope=previous.scope;camera=previous.camera;choose(previous.id,false);});search.addEventListener('input',function(){scope='';query=search.value.trim();selected='me';camera={x:0,y:0,scale:1};renderDetail();layout(true);});
  document.getElementById('brainClear').addEventListener('click',function(){choose('me');search.focus();});
  search.addEventListener('keydown',function(e){if(e.key==='Escape')choose('me');});
  function toggleList(){listMode=!listMode;list.hidden=!listMode;graph.hidden=listMode;graph.style.display=listMode?'none':'';view.setAttribute('aria-pressed',String(listMode));view.textContent=listMode?'Show map':'Browse list';document.getElementById('brainHint').hidden=listMode;[plus,minus,motion,reset].forEach(function(b){b.hidden=listMode;});layout();}
  view.addEventListener('click',toggleList);graph.addEventListener('wheel',function(e){e.preventDefault();zoom(Math.exp(-e.deltaY*.0015));},{passive:false});
  const touches = new Map();
  let pinchDistance = 0;
  function distance() {
    const [a,b] = [...touches.values()];
    return Math.hypot(a.x-b.x,a.y-b.y);
  }
  graph.addEventListener('pointerdown',function(e){
    if(e.pointerType==='touch'){
      touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
      graph.setPointerCapture(e.pointerId);
      if(touches.size>=2){gesture=null;pinchDistance=distance();return;}
    }
    if(e.button!==0||gesture)return;var node=e.target.closest('[data-node]'),id=node&&node.dataset.node;
    targetRotation=null;velocity=0;gesture={id:e.pointerId,node:id,px:e.clientX,py:e.clientY,x:yaw,y:pitch,moved:false};tip.hidden=true;hovered='';graph.setPointerCapture(e.pointerId);graph.classList.add('is-dragging');
  });
  graph.addEventListener('pointermove',function(e){
    if(touches.has(e.pointerId)){
      touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(touches.size===2){
        const next=distance();
        if(next && pinchDistance) zoom(next/pinchDistance);
        pinchDistance=next;return;
      }
    }
    if(!gesture||e.pointerId!==gesture.id)return;var matrix=graph.getScreenCTM();if(!matrix)return;var dx=(e.clientX-gesture.px)/matrix.a,dy=(e.clientY-gesture.py)/matrix.d;
    if(Math.abs(e.clientX-gesture.px)+Math.abs(e.clientY-gesture.py)>5)gesture.moved=true;if(!gesture.moved)return;e.preventDefault();
    const previousYaw=yaw;yaw=gesture.x+dx*.005;velocity=(yaw-previousYaw)*.5; pitch=Math.max(-1.55,Math.min(1.55,gesture.y+dy*.005));paint();
  });
  function release(e){touches.delete(e.pointerId);if(!touches.size)graph.classList.remove('is-dragging');if(!gesture||gesture.id!==e.pointerId)return;var old=gesture;gesture=null;graph.classList.remove('is-dragging');if(graph.hasPointerCapture(e.pointerId))graph.releasePointerCapture(e.pointerId);if(old.node&&!old.moved&&e.type==='pointerup')choose(old.node);else paint();}
  graph.addEventListener('pointerup',release);graph.addEventListener('pointercancel',release);graph.addEventListener('lostpointercapture',release);graph.addEventListener('dragstart',function(e){e.preventDefault();});
  function shouldMove(){return motionEnabled&&!preference.matches&&!staticMode&&inView&&!document.hidden&&!listMode;}
  function frame(now){raf=0;if(!shouldMove())return;if(now-lastFrame>33){paint(now);lastFrame=now;}raf=requestAnimationFrame(frame);}
  function syncMotion(){motion.disabled=preference.matches||staticMode;motion.setAttribute('aria-pressed',String(!motionEnabled||motion.disabled));motion.textContent=motion.disabled?'Motion off':motionEnabled?'Pause motion':'Resume motion';if(shouldMove()){if(!raf)raf=requestAnimationFrame(frame);}else{if(raf)cancelAnimationFrame(raf);raf=0;paint();}}
  motion.addEventListener('click',function(){motionEnabled=!motionEnabled;syncMotion();});document.addEventListener('visibilitychange',syncMotion);preference.addEventListener('change',syncMotion);
  new IntersectionObserver(function(entries){inView=entries[0].isIntersecting;syncMotion();}).observe(graph);
  window.addEventListener('resize',function(){if(mobile!==(window.innerWidth<=600)){yaw=0;pitch=0;velocity=0;targetRotation=null;positions.clear();camera={x:0,y:0,scale:1};layout(true);}});
  renderDetail();layout(true);
  document.fonts.ready.then(function(){paint();});
})();
