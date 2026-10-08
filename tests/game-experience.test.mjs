import test from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from '../js/vendor/chess.mjs';
import {freshClock,advanceClock,completeClockMove,clockTurn,validClock,formatClock,chessTimeoutResult} from '../js/game-clock.mjs';
import {outcomeCopy,penResultFromSave} from '../js/game-feedback.mjs';
import {newPens} from '../js/game-core.mjs';
import {createGameStore} from '../js/game-save.mjs';
import {IDBFactory} from 'fake-indexeddb';
test('3+2 clocks subtract thinking time, increment only the mover, and flag at zero',()=>{
 const start=freshClock(),step=advanceClock(start,'you',2500);assert.equal(step.clock.you,177500);assert.equal(start.you,180000);assert.equal(step.clock.bot,180000);assert.equal(step.flagged,null);
 const moved=completeClockMove(step.clock,'you');assert.equal(moved.you,179500);assert.equal(moved.bot,180000);
 const flag=advanceClock(moved,'bot',200000);assert.equal(flag.clock.bot,0);assert.equal(flag.flagged,'bot');assert.equal(formatClock(179500),'3:00');assert.equal(formatClock(0),'0:00');
});
test('only chess uses the clock; other games and settled rounds stay untimed',()=>{
 assert.equal(clockTurn('chess',{turn:'b'}),'bot');assert.equal(clockTurn('chess',{turn:'w'}),'you');
 for(const game of ['pens','cards','rps','cricket','ultimate'])assert.equal(clockTurn(game,{turn:'you',phase:'ready'}),null);
 assert.equal(clockTurn('chess',{done:true,turn:'w'}),null);
 const untimed=freshClock(false);assert.deepEqual(advanceClock(untimed,'you',999999),{clock:untimed,flagged:null});assert.equal(completeClockMove(untimed,'you'),untimed);assert.equal(advanceClock(freshClock(),null,999999).clock.you,180000);
 assert.equal(validClock({...freshClock(),you:-1}),false);assert.equal(validClock({...freshClock(),bot:Infinity}),false);assert.equal(validClock(freshClock()),true);
});
test('a bare king cannot win on time; checkmate, stalemate and repetition resolve correctly',()=>{
 const king=new Chess('7k/8/8/8/8/8/6Q1/7K w - - 0 1');assert.equal(chessTimeoutResult(king,'you'),'draw');assert.equal(chessTimeoutResult(king,'bot'),'you');
 const stale=new Chess('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');assert.ok(stale.isStalemate());assert.ok(stale.isDraw());
 const rep=new Chess();for(let i=0;i<2;i++)for(const m of ['Nf3','Nf6','Ng1','Ng8'])rep.move(m);assert.ok(rep.isThreefoldRepetition());assert.ok(rep.isDraw());
});
test('clocks and adjudicated results resume privately alongside the actual chess position',async()=>{
 const chess=new Chess();chess.move('e4');const data={version:1,active:'chess',tokens:2,paid:{chess:true},games:{chess:{pgn:chess.pgn()}},clocks:{chess:{you:123000,bot:177000,enabled:true}},settlements:{chess:{result:'draw',reason:'agreed'}}};
 const database=new IDBFactory();await createGameStore(database).write(data);const restored=await createGameStore(database).read();assert.deepEqual(restored,data);assert.equal(await createGameStore(new IDBFactory()).read(),null);
});
test('result messages name the outcome and legacy pen saves infer the winner',()=>{
 assert.equal(outcomeCopy('chess','you',{}).title,'You win!');assert.equal(outcomeCopy('chess','bot',{}).title,'You lost this round.');assert.equal(outcomeCopy('chess','draw',{}).title,'It’s a draw.');
 assert.equal(outcomeCopy('cricket','you',{you:30,bot:12}).score,'You 30 — 12 Shri');
 const pens=newPens();pens[1].x=650;assert.equal(penResultFromSave({phase:'over',pens}),'you');pens[0].x=-2;assert.equal(penResultFromSave({phase:'over',pens}),'draw');assert.equal(penResultFromSave({phase:'ready',pens}),null);
});
