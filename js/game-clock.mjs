export const BLITZ={initial:180000,increment:2000};
export function freshClock(enabled=true){return {you:BLITZ.initial,bot:BLITZ.initial,enabled};}
export function validClock(c){return c&&typeof c.enabled==='boolean'&&['you','bot'].every(k=>Number.isFinite(c[k])&&c[k]>=0&&c[k]<=86400000);}
export function clockTurn(game,s){return game!=='chess'||s.done?null:s.turn==='w'?'you':'bot';}
export function advanceClock(clock,side,elapsed){if(!clock.enabled||!side)return {clock,flagged:null};const next={...clock,[side]:Math.max(0,clock[side]-Math.max(0,elapsed))};return {clock:next,flagged:next[side]===0?side:null};}
export function completeClockMove(clock,side){return clock.enabled?{...clock,[side]:Math.min(86400000,clock[side]+BLITZ.increment)}:clock;}
export function formatClock(ms){const seconds=Math.max(0,Math.ceil(ms/1000));return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;}

export function chessTimeoutResult(chess,flagged){const winner=flagged==='you'?'b':'w';return chess.board().flat().some(p=>p?.color===winner&&p.type!=='k')?(flagged==='you'?'bot':'you'):'draw';}
