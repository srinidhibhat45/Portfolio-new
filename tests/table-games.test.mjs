import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {IDBFactory} from 'fake-indexeddb';
import {createGameStore,validSave,GAME_IDS} from '../js/game-save.mjs';
import {GAME_GUIDES,outcomeCopy} from '../js/game-feedback.mjs';
import {
 TABLE_GAME_IDS,newConnect,connectMove,connectMoves,connectChoice,
 newDots,dotsMove,dotsMoves,dotsChoice,DOT_BOXES,
 newMemory,memoryMove,closeMemoryPair,validTableGame
} from '../js/table-games.mjs';
const playColumns = moves => moves.reduce((state, col) => connectMove(state,col),newConnect());

test('Connect Four applies gravity, keeps input immutable and rejects full or invalid columns',()=>{
 const initial=newConnect(),next=connectMove(initial,3);
 assert.equal(initial.cells[38],null);assert.equal(next.cells[38],'you');assert.equal(next.turn,'bot');
 let state=newConnect();for(let i=0;i<6;i++)state=connectMove(state,0);
 assert.ok(!connectMoves(state).includes(0));assert.throws(()=>connectMove(state,0));
 for(const bad of [-1,7,1.2,'2'])assert.throws(()=>connectMove(newConnect(),bad));
 assert.ok(validTableGame('connect',state));
});
test('Connect Four finds horizontal, vertical and diagonal wins without wrapping between rows',()=>{
 for(const moves of [[0,6,1,6,2,5,3],[0,1,0,1,0,2,0],[0,1,1,2,4,2,2,3,4,3,5,3,3]]){
  const state=playColumns(moves);assert.equal(state.result,'you');assert.equal(state.line.length,4);assert.equal(connectMoves(state).length,0);assert.ok(validTableGame('connect',state));
  assert.throws(()=>connectMove(state,5));
 }
 const state=playColumns([5,1,6,1,0,2,1]);assert.equal(state.result,null);
});
test('Connect Four bot takes a win, blocks an immediate loss and leaves state unchanged',()=>{
 const attack=playColumns([0,6,1,6,4,6,4]),before=structuredClone(attack);
 assert.equal(connectChoice(attack),6);assert.deepEqual(attack,before);
 assert.equal(connectChoice(playColumns([0,6,1,6,2])),3);
 assert.equal(connectChoice(playColumns([0,6,1,6,2,5,3])),null);
});
test('Connect Four settles a full draw and validates saved winning lines',()=>{
 const moves=[4,6,5,6,0,1,0,3,1,0,2,4,0,4,6,2,6,6,4,4,4,3,3,0,2,6,2,1,1,0,2,2,1,1,5,5,5,3,3,5,3,5];
 const state=playColumns(moves);assert.equal(state.result,'draw');assert.ok(validTableGame('connect',state));
 const won=playColumns([0,6,1,6,2,5,3]);assert.equal(validTableGame('connect',{...won,line:[0,1,2,3]}),false);
 const floating=newConnect();floating.cells[0]='you';floating.turn='bot';assert.equal(validTableGame('connect',floating),false);
});
test('Dots & Boxes claims shared boxes in one move and grants an extra turn',()=>{
 const state=newDots();for(const edge of [0,3,12,1,4,14])state.edges[edge]='bot';
 const before=structuredClone(state),next=dotsMove(state,13);
 assert.deepEqual(state,before);assert.equal(next.boxes[0],'you');assert.equal(next.boxes[1],'you');assert.equal(next.turn,'you');assert.ok(validTableGame('dots',next));
 assert.throws(()=>dotsMove(next,13));assert.equal(dotsMove(newDots(),0).turn,'bot');
});
test('Dots & Boxes bot captures boxes and avoids creating a third side when a safe line exists',()=>{
 let state=newDots();for(const edge of [0,3,12])state.edges[edge]='you';state.turn='bot';
 const before=structuredClone(state);assert.equal(dotsChoice(state,()=>.5),13);assert.deepEqual(state,before);
 state=newDots();state.edges[0]=state.edges[3]='you';state.turn='bot';
 const next=dotsMove(state,dotsChoice(state,()=>.5));
 assert.ok(!DOT_BOXES.some((sides,i)=>!next.boxes[i]&&sides.filter(e=>next.edges[e]).length===3));
});
test('Dots & Boxes ends only after nine boxes and restores extra turns',()=>{
 let state=newDots(),count=0;
 while(!state.result){state=dotsMove(state,dotsChoice(state,()=>.5));assert.ok(validTableGame('dots',state));assert.ok(++count<=24);}
 assert.equal(state.boxes.filter(Boolean).length,9);assert.equal(state.edges.filter(Boolean).length,24);assert.equal(dotsMoves(state).length,0);assert.equal(dotsChoice(state),null);
 assert.equal(state.result,state.boxes.filter(v=>v==='you').length>4?'you':'bot');
 assert.equal(validTableGame('dots',{...newDots(),boxes:['you',...Array(8).fill(null)]}),false);
});
test('Pattern Memory has six shuffled pairs and never rewards repeated or matched tile selection',()=>{
 const initial=newMemory(()=>.5);for(let pair=0;pair<6;pair++)assert.equal(initial.deck.filter(v=>v===pair).length,2);
 const before=structuredClone(initial),first=memoryMove(initial,0);assert.deepEqual(initial,before);assert.deepEqual(first.open,[0]);
 assert.equal(memoryMove(first,0),first);assert.equal(first.turns,0);
 const partner=first.deck.findIndex((v,i)=>i!==0&&v===first.deck[0]);const matched=memoryMove(first,partner);
 assert.equal(matched.matched.length,2);assert.equal(matched.turns,1);assert.deepEqual(matched.open,[]);assert.equal(memoryMove(matched,partner),matched);assert.ok(validTableGame('memory',matched));
});
test('Pattern Memory preserves a mismatched pair until it is explicitly closed',()=>{
 let state=newMemory(()=>.5);state=memoryMove(state,0);const mismatch=state.deck.findIndex(v=>v!==state.deck[0]);state=memoryMove(state,mismatch);
 assert.equal(state.open.length,2);assert.equal(state.turns,1);assert.ok(validTableGame('memory',state));
 assert.equal(memoryMove(state,3),state);const closed=closeMemoryPair(state);assert.equal(state.open.length,2);assert.deepEqual(closed.open,[]);assert.equal(closed.turns,1);
});
test('Pattern Memory completes after all pairs and validates damaged save data',()=>{
 let state=newMemory(()=>.5);
 for(let pair=0;pair<6;pair++)for(const index of state.deck.flatMap((v,i)=>v===pair?[i]:[]))state=memoryMove(state,index);
 assert.equal(state.result,'you');assert.equal(state.turns,6);assert.equal(state.matched.length,12);assert.ok(validTableGame('memory',state));assert.equal(memoryMove(state,0),state);
 assert.equal(validTableGame('memory',{...newMemory(),open:[0,0]}),false);
 assert.equal(validTableGame('memory',{...newMemory(),deck:Array(12).fill(0)}),false);
 assert.equal(validTableGame('memory',{...newMemory(),result:'you'}),false);
});
test('new games share private persistence while legacy six-game saves remain valid',async()=>{
 const legacy={version:1,active:'chess',savedAt:1,tokens:8,paid:{chess:true},games:{chess:{pgn:'1. e4'},pens:{phase:'moving'}}};
 assert.equal(validSave(legacy),legacy);
 const games={...legacy.games,connect:playColumns([0,1,0]),dots:dotsMove(newDots(),0),memory:memoryMove(newMemory(()=>.5),0)};
 const data={...legacy,active:'connect',games};const factory=new IDBFactory();await createGameStore(factory).write(data);const restored=await createGameStore(factory).read();assert.deepEqual(restored,data);
 assert.deepEqual(restored.games.chess,legacy.games.chess);assert.equal(restored.tokens,8);for(const id of TABLE_GAME_IDS){assert.ok(GAME_IDS.includes(id));assert.ok(validTableGame(id,restored.games[id]));}
 assert.equal(await createGameStore(new IDBFactory()).read(),null);
});
test('all games share one labelled chooser, with reachable panels and game controls',()=>{
 const html=readFileSync('index.html','utf8');
 const chooser=html.match(/<select id="playGameSelect"[^>]*>([\s\S]*?)<\/select>/g);
 assert.equal(chooser.length,1);
 assert.deepEqual([...chooser[0].matchAll(/option value="([^"]+)"/g)].map(m=>m[1]),GAME_IDS);
 for(const id of GAME_IDS){
  const panelId='panel'+id[0].toUpperCase()+id.slice(1);
  assert.match(html,new RegExp('role="region"[^>]*id="'+panelId+'" aria-label="[^"]+"'));
 }
 for(const id of TABLE_GAME_IDS){
  assert.ok(html.includes(`option value="${id}"`));assert.ok(html.includes(`id="panel${id[0].toUpperCase()+id.slice(1)}"`));assert.ok(html.includes(`data-reset="${id}"`));assert.ok(html.includes(`id="${id}Status"`));assert.ok(GAME_GUIDES[id].rules.length>60);
 }
 assert.match(outcomeCopy('memory','you',{turns:9}).score,/9 turns/);
 assert.equal(outcomeCopy('dots','you',{boxes:['you','bot','you']}).score,'You 2 — 1 Shri');
});
