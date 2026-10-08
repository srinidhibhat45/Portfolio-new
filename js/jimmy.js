import {freshJimmy,restoreJimmy,giveTreat,treatWait,chooseTrick,strokeDistance} from './jimmy-state.mjs';

const dock=document.getElementById('jimmyDock'),pet=document.getElementById('jimmyPet');
const treat=document.getElementById('jimmyTreat'),trick=document.getElementById('jimmyTrick'),rest=document.getElementById('jimmyRest');
const bubble=document.getElementById('jimmyBubble'),status=document.getElementById('jimmyStatus');
const phone=matchMedia('(max-width:600px)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
const key='portfolio-jimmy-v1';
let memory=freshJimmy(),idleTimer,actionTimer,bubbleTimer,treatTimer,gesture=null,overlay=false,lastBoop=0;
try {memory=restoreJimmy(JSON.parse(localStorage.getItem(key)));} catch {}
function save(){try{localStorage.setItem(key,JSON.stringify(memory));}catch{}}
function available(){return !document.hidden&&!phone.matches&&!dock.inert&&!overlay;}
function base(){dock.dataset.state=memory.resting?'nap':'idle';dock.style.setProperty('--jimmy-look','0deg');}
function speak(text){
  bubble.textContent=text;status.textContent=text;dock.classList.add('is-speaking');
  clearTimeout(bubbleTimer);bubbleTimer=setTimeout(()=>dock.classList.remove('is-speaking'),2600);
}
function controls(){
  rest.setAttribute('aria-pressed',String(memory.resting));
  rest.setAttribute('aria-label',memory.resting?'Wake Jimmy up':'Let Jimmy nap');
  const wait=treatWait(memory);
  treat.disabled=wait>0;
  treat.title=wait?'Jimmy is still enjoying his biscuit. Another treat in a little while.':'Give Jimmy a little biscuit';
  treat.setAttribute('aria-label',wait?'Treat, Jimmy is still enjoying his last biscuit':'Treat, give Jimmy a biscuit');
  clearTimeout(treatTimer);
  if(wait&&available())treatTimer=setTimeout(controls,wait+30);
}
function schedule(){
  clearTimeout(idleTimer);
  if(!available()||memory.resting||reduced.matches||/[?&]static/.test(location.search))return;
  idleTimer=setTimeout(()=>{
    if(!available()||gesture||dock.matches(':hover,:focus-within')){schedule();return;}
    const choice=Math.random();
    if(choice>.88){dock.dataset.state='nap';schedule();return;}
    action(choice>.5?'look':'sniff','',2400);
  },22000+Math.random()*28000);
}
function action(state,line,duration=2200,after){
  if(!available())return;
  clearTimeout(idleTimer);clearTimeout(actionTimer);
  if(dock.dataset.state===state){dock.dataset.state='idle';void pet.offsetWidth;}
  dock.dataset.state=state;
  if(line)speak(line);
  actionTimer=setTimeout(()=>{base();if(after&&available())after();else schedule();},duration);
}
function wake(){memory.resting=false;controls();}
function boop(){
  if(!available()||Date.now()-lastBoop<700)return;
  lastBoop=Date.now();wake();save();
  action('boop',['Who, me?','You rang?','A very important boop.','Cheh! Hello to you too.'][Math.floor(Math.random()*4)],1300);
}
function cuddle(){
  wake();memory.pets=Math.min(999999,memory.pets+1);save();
  action('petting',['That’s the spot.','Head scratches? Excellent.','I like you, human.','More of that, please.'][Math.floor(Math.random()*4)],2300);
}
function perform(){
  wake();save();
  const state=chooseTrick(),lines={paw:'A paw. For you.',spin:'One tiny victory lap.',stretch:'Long dog. Good stretch.',hop:'Ta-da. Jimmy style.'};
  action(state,lines[state],state==='stretch'?2900:state==='hop'?2700:2500);
}
treat.addEventListener('click',()=>{
  if(!giveTreat(memory))return;
  save();controls();
  action('treat','Crunch. Worth it.',1900,()=>{
    if(Math.random()<.45)action('paw','Thank you. Here’s a paw.',2500);else schedule();
  });
});
trick.addEventListener('click',perform);
document.getElementById('jimmyCuddle').addEventListener('click',cuddle);
rest.addEventListener('click',()=>{
  memory.resting=!memory.resting;clearTimeout(actionTimer);base();save();controls();
  speak(memory.resting?'Wake me for the good bits.':'Present. And very good.');schedule();
});
pet.addEventListener('pointerdown',event=>{
  if(event.button!==0||!available())return;
  gesture={id:event.pointerId,last:{x:event.clientX,y:event.clientY},distance:0,petted:false};
  pet.setPointerCapture(event.pointerId);clearTimeout(idleTimer);
});
pet.addEventListener('pointermove',event=>{
  if(gesture){
    if(event.pointerId!==gesture.id)return;
    const next={x:event.clientX,y:event.clientY};gesture.distance+=strokeDistance(gesture.last,next);gesture.last=next;
    if(gesture.distance>=24){
      if(!gesture.petted){gesture.petted=true;wake();memory.pets=Math.min(999999,memory.pets+1);save();action('petting','That’s the spot.',1600);}
      if(dock.dataset.state!=='petting')action('petting','',1600);
      clearTimeout(actionTimer);
      actionTimer=setTimeout(()=>{base();schedule();},1600);
      // A tiny lean follows the hand, while Jimmy stays on his little bed.
      const bounds=pet.getBoundingClientRect();
      dock.style.setProperty('--jimmy-look',Math.max(-4,Math.min(4,(event.clientX-bounds.left-bounds.width/2)*.06))+'deg');
    }
  }else if(!memory.resting){
    const bounds=pet.getBoundingClientRect();
    dock.style.setProperty('--jimmy-look',Math.max(-5,Math.min(5,(event.clientX-bounds.left-bounds.width/2)*.06))+'deg');
  }
});
function release(event){
  if(!gesture||event.pointerId!==gesture.id)return;
  const petted=gesture.petted;gesture=null;
  if(pet.hasPointerCapture(event.pointerId))pet.releasePointerCapture(event.pointerId);
  if(event.type==='pointerup'&&!petted)boop();else if(petted){clearTimeout(actionTimer);actionTimer=setTimeout(()=>{base();schedule();},1100);}else{base();schedule();}
}
pet.addEventListener('pointerup',release);pet.addEventListener('pointercancel',release);
pet.addEventListener('lostpointercapture',()=>{if(gesture){gesture=null;clearTimeout(actionTimer);base();schedule();}});
pet.addEventListener('click',event=>{if(event.detail===0)boop();});
pet.addEventListener('pointerleave',()=>{if(!gesture)dock.style.setProperty('--jimmy-look','0deg');});
pet.addEventListener('pointerenter',()=>{if(dock.dataset.state==='nap'&&!memory.resting)base();});
function sync(){
  const active=available();dock.classList.toggle('is-paused',!active||reduced.matches||/[?&]static/.test(location.search));
  dock.classList.toggle('is-away',overlay||dock.inert);
  if(!active){clearTimeout(idleTimer);clearTimeout(actionTimer);clearTimeout(treatTimer);gesture=null;base();}
  else schedule();
  controls();
}
document.addEventListener('visibilitychange',sync);
document.addEventListener('portfolio:dialog',event=>{overlay=!!event.detail.open;sync();});
new MutationObserver(sync).observe(dock,{attributes:true,attributeFilter:['inert']});
phone.addEventListener('change',sync);reduced.addEventListener('change',sync);
window.addEventListener('pagehide',save);
base();controls();sync();
