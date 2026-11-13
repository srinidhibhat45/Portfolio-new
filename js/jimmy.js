import {freshJimmy,restoreJimmy,giveTreat,treatWait,pickFresh,strokeDistance,TRICKS,PETS,STROKES,BOOPS,AFTER_TREAT} from './jimmy-state.mjs?v=20261113-acts-1';

const dock=document.getElementById('jimmyDock'),pet=document.getElementById('jimmyPet');
const treat=document.getElementById('jimmyTreat'),trick=document.getElementById('jimmyTrick'),rest=document.getElementById('jimmyRest');
const bubble=document.getElementById('jimmyBubble'),status=document.getElementById('jimmyStatus');
const phone=matchMedia('(max-width:600px)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
const key='portfolio-jimmy-v1';
let memory=freshJimmy(),idleTimer,actionTimer,bubbleTimer,treatTimer,gesture=null,overlay=false,lastBoop=0;
try {memory=restoreJimmy(JSON.parse(localStorage.getItem(key)));} catch {}
function save(){try{localStorage.setItem(key,JSON.stringify(memory));}catch{}}
function available(){return !document.hidden&&!phone.matches&&!dock.inert&&!overlay;}

/* Small things that appear around him: hearts, music, a ball, a butterfly, a sneeze, dizzy stars.
   Hand-drawn SVG in the site's colours; data-prop on the dock decides which one shows. */
const heart='<svg viewBox="0 0 24 24"><path d="M12 21C-1 12 4 2.500 12 8c8-5.500 13 4 0 13Z"/></svg>';
const star='<svg viewBox="0 0 24 24"><path d="M12 1.500 14.600 9.400 22.500 12l-7.900 2.600L12 22.500 9.400 14.600 1.500 12l7.900-2.600Z"/></svg>';
const puff='<svg viewBox="0 0 24 24"><circle cx="8" cy="14" r="5.200"/><circle cx="15" cy="9.500" r="6"/><circle cx="16.500" cy="16.500" r="4.200"/></svg>';
const ball='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11"/><path d="M3.200 6.800c5 2.300 5 8.100 0 10.400M20.800 6.800c-5 2.300-5 8.100 0 10.400"/></svg>';
const props=document.createElement('span');
props.className='jimmy-props';props.setAttribute('aria-hidden','true');
props.innerHTML=
  `<span class="jp jp-hearts"><i>${heart}</i><i>${heart}</i><i>${heart}</i></span>`+
  '<span class="jp jp-notes"><i><svg viewBox="0 0 24 24"><path d="M9 18V5.500l10-2.200v12"/><circle cx="6.500" cy="18" r="3"/><circle cx="16.500" cy="15.300" r="3"/></svg></i><i><svg viewBox="0 0 24 24"><path d="M14 17V3.500c1.500 2.500 5 3.200 5 7"/><ellipse cx="10.500" cy="17.500" rx="4" ry="3.200"/></svg></i></span>'+
  `<span class="jp jp-stars"><i>${star}</i><i>${star}</i><i>${star}</i></span>`+
  '<span class="jp jp-sparkle"><svg viewBox="-12 -12 24 24"><path d="M0-5V-10.500M4.300-2.500 9-5.200M4.300 2.500 9 5.200M0 5V10.500M-4.300 2.500-9 5.200M-4.300-2.500-9-5.200"/></svg></span>'+
  `<span class="jp jp-puff">${puff}</span>`+
  `<span class="jp jp-dust"><i>${puff}</i><i>${puff}</i><i>${puff}</i></span>`+
  `<span class="jp jp-ball">${ball}</span><span class="jp jp-ball-back">${ball}</span>`+
  '<span class="jp jp-butterfly"><svg viewBox="0 0 24 20"><path class="jp-wings" d="M12 9.500C9.500 2 2 .500 2 5.500c0 4 5 5 10 4Zm0 0c-4 1-8.500 3-6.500 7 2 3 5.500-1 6.500-7Zm0 0C14.500 2 22 .500 22 5.500c0 4-5 5-10 4Zm0 0c4 1 8.500 3 6.500 7-2 3-5.500-1-6.500-7Z"/><path class="jp-body" d="M12 4.500v11"/></svg></span>';
pet.append(props);
let prop='';
function setProp(next,restart){
  if(next===prop&&!restart)return;
  prop=next;dock.dataset.prop='';
  if(next){void props.offsetWidth;dock.dataset.prop=next;}
}

/* Everything he does is a short run of poses. A step is [pose, milliseconds, prop, line].
   A line can be a list; one is picked at random. The act's own line is said on its first step. */
const ACTS={
  // Tricks: the first seven are single poses, the rest little routines.
  paw:{line:'A paw. For you.',steps:[['paw',2500]]},
  spin:{line:'One tiny victory lap.',steps:[['spin',2500]]},
  stretch:{line:'Long dog. Good stretch.',steps:[['stretch',2900]]},
  hop:{line:'Ta-da. Jimmy style.',steps:[['hop',2700]]},
  roll:{line:'Roll over? Done. Belly rubs now.',steps:[['roll',2900]]},
  beg:{line:'Sitting pretty. Treat, please?',steps:[['beg',2500]]},
  speak:{line:'Woof. That was my whole speech.',steps:[['speak',2500]]},
  highfive:{line:['High five! Up top.','Paw-five. Nailed it.'],steps:[['highfive',1800,'sparkle']]},
  zoomies:{line:['Zoomies! Can’t stop, won’t stop.','Nyoom. Lap of honour.'],steps:[['zoom',1800,'dust'],['pant',1100,'']]},
  tail:{line:['Hold still, tail!','Almost… almost…'],steps:[['chase',1800],['dizzy',1500,'stars',['The tail wins again.','Okay. The room is spinning.']]]},
  playdead:{line:['Bang! Ahh, you got me.','Bang! …'],steps:[['flop',2100],['peek',1300,'',['Did it work? Award, please.','Good acting, no?']]]},
  dance:{line:['A little dance for my favourite human.','Goan dog, Goan moves.'],prop:'notes',steps:[['dance1',560],['dance2',560],['dance3',680],['dance4',820],['pant',700]]},
  howl:{line:['Awoooo! That was a love song.','Aaawoo. Top of the charts.'],steps:[['howl',2700,'notes']]},
  fetch:{line:['Ball! Ball! BALL!','Throw it, throw it!'],steps:[['watch',800,'ballout'],['dash',1400],['proud',1500,'ballback',['Got it. Again?','Fetched. Throw it again?']]]},
  butterfly:{line:['Ooh. A butterfly.','Hello, little friend.'],steps:[['sniff',1000,'butterfly'],['skyward',1200],['pounce',900],['look',1000,'',['It got away. Next time.','Too quick. Respect.']]]},
  sneeze:{line:'Sniff sniff…',steps:[['sniff',1100],['achoo',1100,'puff','Achoo!'],['look',900,'','Excuse me.']]},
  // Pets.
  bliss:{line:['That’s the spot.','Head scratches? Excellent.','I like you, human.','More of that, please.'],steps:[['petting',2300,'hearts']]},
  bellyrub:{line:['Belly rubs? Yes. All of them.','Right there. The leg kicks on its own.'],steps:[['bellyrub',2600,'hearts']]},
  lean:{line:['I’ll just lean into that.','You’re very good at this.'],steps:[['lean',2300,'hearts']]},
  wiggle:{line:['Happy wiggle! The tail can’t keep up.','Whole-body wag. Sorry.'],steps:[['wiggle',2000]]},
  melt:{line:['Melting. I’m a puddle now.','Too nice. Lying down for this.'],steps:[['petting',1300,'hearts'],['melt',1600]]},
  // Boops.
  boop:{line:['Who, me?','You rang?'],steps:[['boop',1300]]},
  tilt:{line:['Hmm? A very important boop.','Boop received. Processing.'],steps:[['tilt',1300]]},
  boopsneeze:{line:['Boop-achoo!','Achoo! Ticklish nose.'],steps:[['achoo',1200,'puff']]},
  boing:{line:['Boing! Hello!','Cheh! Hello to you too.'],steps:[['boing',1200]]},
  woof:{line:['Woof! Right back at you.','Woof. That means hi.'],steps:[['woof',1300]]},
  // Treats: the biscuit first, then one of these.
  munch:{line:['Crunch. Worth it.','Mmm. Biscuit.','Nom. Five stars.'],steps:[['treat',1900]]},
  thanks:{line:['Thank you. Here’s a paw.','Thank you, kind human.'],steps:[['paw',2400]]},
  seconds:{line:['Another? I’ll be very good.','Sitting pretty for seconds.'],steps:[['beg',2200]]},
  adore:{line:['Best human. Official.','I’ll remember this forever. Or ten minutes.'],steps:[['adore',2200,'hearts']]},
};
const say=line=>Array.isArray(line)?line[Math.floor(Math.random()*line.length)]:line;

let run=0;
function base(){run++;setProp('');dock.dataset.state=memory.resting?'nap':'idle';dock.style.setProperty('--jimmy-look','0deg');}
function speak(text){
  bubble.textContent=text;status.textContent=text;dock.classList.add('is-speaking');
  clearTimeout(bubbleTimer);bubbleTimer=setTimeout(()=>dock.classList.remove('is-speaking'),2600);
}
function pose(state){
  // The same pose twice in a row still plays its movement again.
  if(dock.dataset.state===state){dock.dataset.state='idle';void pet.offsetWidth;}
  dock.dataset.state=state;
}
function play(name,{quiet=false,after}={}){
  const act=ACTS[name];
  if(!act||!available())return;
  clearTimeout(idleTimer);clearTimeout(actionTimer);
  const id=++run;let index=0;
  setProp(act.prop||'',true);
  const next=()=>{
    if(id!==run)return;
    if(index>=act.steps.length){base();if(after&&available())after();else schedule();return;}
    const [state,ms,stepProp,stepLine]=act.steps[index++];
    pose(state);
    if(stepProp!==undefined)setProp(stepProp,index===1);
    const line=stepLine||(index===1?act.line:'');
    if(line&&!quiet)speak(say(line));
    actionTimer=setTimeout(next,ms);
  };
  next();
}
function controls(){
  rest.setAttribute('aria-pressed',String(memory.resting));
  rest.setAttribute('aria-label',memory.resting?'Wake Jimmy up':'Let Jimmy nap');
  const wait=treatWait(memory);
  // Not disabled, so a second biscuit too soon still gets an answer.
  treat.setAttribute('aria-disabled',String(wait>0));
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
    // Left alone, he looks about, sniffs, stretches, now and then spots a butterfly or sneezes, or dozes off.
    const choice=Math.random();
    if(choice>.9){dock.dataset.state='nap';schedule();return;}
    play(choice>.75?'butterfly':choice>.65?'stretch':choice>.57?'sneeze':choice>.3?'look':'sniff',{quiet:true});
  },22000+Math.random()*28000);
}
// Idle glances are single poses with no words.
ACTS.look={steps:[['look',2400]]};ACTS.sniff={steps:[['sniff',2400]]};

function wake(){memory.resting=false;controls();}
let lastTrick='',lastPet='',lastStroke='',lastBoopAct='',lastAfter='';
function boop(){
  if(!available()||Date.now()-lastBoop<700)return;
  lastBoop=Date.now();wake();save();
  lastBoopAct=pickFresh(BOOPS,lastBoopAct);play(lastBoopAct);
}
function cuddle(){
  wake();memory.pets=Math.min(999999,memory.pets+1);save();
  lastPet=pickFresh(PETS,lastPet);play(lastPet);
}
function perform(){
  wake();save();
  // Any trick he knows, never the same one twice in a row.
  lastTrick=pickFresh(TRICKS,lastTrick);play(lastTrick);
}
/* While a hand strokes him he holds one happy pose (picked fresh each time) until it stops. */
function hold(name,first){
  const act=ACTS[name],[state,,stepProp]=act.steps[0];
  run++;clearTimeout(idleTimer);clearTimeout(actionTimer);
  if(dock.dataset.state!==state)pose(state);
  setProp(stepProp||act.prop||'');
  if(first)speak(say(act.line));
}
treat.addEventListener('click',()=>{
  if(!giveTreat(memory)){if(available())speak(['Still crunching the last one.','One biscuit at a time, human.'][Math.floor(Math.random()*2)]);return;}
  save();controls();
  play('munch',{after:()=>{
    lastAfter=pickFresh(AFTER_TREAT,lastAfter);
    if(lastAfter==='rest')schedule();else play(lastAfter);
  }});
});
trick.addEventListener('click',perform);
document.getElementById('jimmyCuddle').addEventListener('click',cuddle);
rest.addEventListener('click',()=>{
  memory.resting=!memory.resting;clearTimeout(actionTimer);base();save();controls();
  speak(memory.resting?'Wake me for the good bits.':'Present. And very good.');schedule();
});
pet.addEventListener('pointerdown',event=>{
  if(event.button!==0||!available())return;
  gesture={id:event.pointerId,last:{x:event.clientX,y:event.clientY},distance:0,petted:false,hold:''};
  pet.setPointerCapture(event.pointerId);clearTimeout(idleTimer);
});
pet.addEventListener('pointermove',event=>{
  if(gesture){
    if(event.pointerId!==gesture.id)return;
    const next={x:event.clientX,y:event.clientY};gesture.distance+=strokeDistance(gesture.last,next);gesture.last=next;
    if(gesture.distance>=24){
      if(!gesture.petted){
        gesture.petted=true;wake();memory.pets=Math.min(999999,memory.pets+1);save();
        gesture.hold=lastStroke=pickFresh(STROKES,lastStroke);hold(gesture.hold,true);
      }else if(dock.dataset.state!==ACTS[gesture.hold].steps[0][0])hold(gesture.hold,false);
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
// Jimmy can be sent to the edge of the screen, where a small tab brings him back.
const awayKey='portfolio-jimmy-away',showButton=document.getElementById('jimmyShow');
function send(away,focus){
  dock.hidden=away;dock.inert=away;showButton.hidden=!away;
  try{localStorage.setItem(awayKey,away?'1':'0');}catch{}
  if(focus){
    (away?showButton:pet).focus({preventScroll:true});
    if(!away)setTimeout(()=>speak('Back. Did you miss me?'),150);
  }
}
document.getElementById('jimmyHide').addEventListener('click',()=>send(true,true));
showButton.addEventListener('click',()=>send(false,true));
try{if(localStorage.getItem(awayKey)==='1')send(true,false);}catch{}
document.addEventListener('visibilitychange',sync);
document.addEventListener('portfolio:dialog',event=>{overlay=!!event.detail.open;sync();});
new MutationObserver(sync).observe(dock,{attributes:true,attributeFilter:['inert']});
phone.addEventListener('change',sync);reduced.addEventListener('change',sync);
window.addEventListener('pagehide',save);
// A hook for testing in the browser: window.__jimmy.play('fetch').
if(/[?&]jimmy=debug/.test(location.search))window.__jimmy={play,acts:Object.keys(ACTS)};
base();controls();sync();
