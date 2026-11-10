import test from 'node:test';
import assert from 'node:assert/strict';
import {freshJimmy,restoreJimmy,giveTreat,treatWait,chooseTrick,strokeDistance,TREAT_INTERVAL,TRICKS} from '../js/jimmy-state.mjs';

test('Jimmy remembers affection and rest locally, and restores malformed memories safely',()=>{
  const saved={...freshJimmy(),pets:7,treats:2,lastTreat:1000,resting:true};
  assert.deepEqual(restoreJimmy(JSON.parse(JSON.stringify(saved)),2000),saved);
  assert.deepEqual(restoreJimmy({version:99}),freshJimmy());
  assert.deepEqual(restoreJimmy({version:1,pets:-10,treats:Infinity,lastTreat:'bad',resting:'yes'}),freshJimmy());
  assert.equal(restoreJimmy({...saved,lastTreat:9000},2000).lastTreat,2000);
});
test('treats have a persistent cooldown that repeated clicks and reloads cannot bypass',()=>{
  const state=freshJimmy();
  assert.equal(giveTreat(state,1000),true);
  assert.equal(giveTreat(state,1001),false);
  const restored=restoreJimmy(JSON.parse(JSON.stringify(state)),2000);
  assert.equal(treatWait(restored,2000),TREAT_INTERVAL-1000);
  assert.equal(giveTreat(restored,1000+TREAT_INTERVAL),true);
  assert.equal(restored.treats,2);
});
test('random tricks cover all seven tricks evenly; stroke distance is independent of direction',()=>{
  assert.deepEqual(TRICKS,['paw','spin','stretch','hop','roll','beg','speak']);
  assert.deepEqual(TRICKS.map((_,i)=>chooseTrick(()=>(i+.5)/TRICKS.length)),TRICKS);
  assert.equal(chooseTrick(()=>0),'paw');
  assert.equal(chooseTrick(()=>1),'speak');
  assert.equal(strokeDistance({x:0,y:0},{x:3,y:4}),5);
  assert.equal(strokeDistance({x:3,y:4},{x:0,y:0}),5);
});
