/* Jimmy's small memories belong to this browser, never to a public scoreboard. */
export const TREAT_INTERVAL = 45000;
export function freshJimmy() { return {version:1,pets:0,treats:0,lastTreat:0,resting:false}; }
export function restoreJimmy(value, now = Date.now()) {
  if (!value || value.version !== 1) return freshJimmy();
  const count = n => Number.isSafeInteger(n) && n >= 0 ? Math.min(n,999999) : 0;
  return {version:1,pets:count(value.pets),treats:count(value.treats),
    lastTreat:Number.isFinite(value.lastTreat) && value.lastTreat > 0 ? Math.min(value.lastTreat,now) : 0,
    resting:value.resting === true};
}
export function treatWait(state, now = Date.now()) { return state.lastTreat ? Math.max(0,TREAT_INTERVAL - (now-state.lastTreat)) : 0; }
export function giveTreat(state, now = Date.now()) {
  if (treatWait(state,now)) return false;
  state.lastTreat=now;state.treats=Math.min(999999,state.treats+1);state.resting=false;
  return true;
}
/* Every trick Jimmy knows. The first seven are single poses; the rest are little routines
   strung together from his poses (see ACTS in jimmy.js). */
export const TRICKS = ['paw','spin','stretch','hop','roll','beg','speak','highfive','zoomies','tail','playdead','dance','howl','fetch','butterfly'];
/* How he answers a pet, a boop, and what he does once a biscuit is gone. */
export const PETS = ['bliss','bellyrub','lean','wiggle','melt'];
export const STROKES = ['bliss','bellyrub','lean','wiggle'];
export const BOOPS = ['boop','tilt','boopsneeze','boing','woof'];
export const AFTER_TREAT = ['thanks','dance','seconds','adore','zoomies','bellyrub','rest'];
export function chooseTrick(random = Math.random) { return pick(TRICKS,random); }
function pick(choices, random) {
  return choices[Math.min(choices.length-1,Math.max(0,Math.floor(random()*choices.length)))];
}
/* Any reaction from a pool, but never the one he just did. */
export function pickFresh(pool, last, random = Math.random) {
  const choices = pool.length > 1 ? pool.filter(item => item !== last) : pool;
  return pick(choices,random);
}
export function strokeDistance(previous, next) { return Math.hypot(next.x-previous.x,next.y-previous.y); }
