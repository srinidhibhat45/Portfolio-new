import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {freshJimmy,restoreJimmy,giveTreat,treatWait,chooseTrick,pickFresh,strokeDistance,TREAT_INTERVAL,TRICKS,PETS,STROKES,BOOPS,AFTER_TREAT} from '../js/jimmy-state.mjs';

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
test('random tricks cover every trick evenly; stroke distance is independent of direction',()=>{
  assert.equal(TRICKS.length,15);
  assert.equal(new Set(TRICKS).size,TRICKS.length);
  assert.deepEqual(TRICKS.map((_,i)=>chooseTrick(()=>(i+.5)/TRICKS.length)),TRICKS);
  assert.equal(chooseTrick(()=>0),TRICKS[0]);
  assert.equal(chooseTrick(()=>1),TRICKS.at(-1));
  assert.equal(strokeDistance({x:0,y:0},{x:3,y:4}),5);
  assert.equal(strokeDistance({x:3,y:4},{x:0,y:0}),5);
});
test('every reaction pool is random but never repeats the reaction he just did',()=>{
  for (const pool of [TRICKS,PETS,STROKES,BOOPS,AFTER_TREAT]) {
    let last='';
    for (let i=0;i<200;i++) {
      const next=pickFresh(pool,last);
      assert.ok(pool.includes(next));
      assert.notEqual(next,last);
      last=next;
    }
    // Every other reaction can come up, evenly.
    const others=pool.filter(item=>item!==pool[0]);
    assert.deepEqual(others.map((_,i)=>pickFresh(pool,pool[0],()=>(i+.5)/others.length)),others);
  }
  assert.equal(pickFresh(['only'],'only'),'only');
  assert.equal(pickFresh(['a','b'],'a',()=>.99),'b');
});
test('every reaction in a pool is a routine Jimmy can play, and every pose it uses is drawn',()=>{
  const script=readFileSync(new URL('../js/jimmy.js',import.meta.url),'utf8');
  const css=readFileSync(new URL('../css/features.css',import.meta.url),'utf8');
  const acts=script.slice(script.indexOf('const ACTS={'),script.indexOf('const say='));
  for (const name of new Set([...TRICKS,...PETS,...STROKES,...BOOPS,...AFTER_TREAT.filter(n=>n!=='rest'),'munch','sneeze'])) {
    assert.match(acts,new RegExp(`\\b${name}:\\{`),`${name} has a routine`);
  }
  const poses=new Set([...acts.matchAll(/\['([a-z0-9]+)',\d+/g)].map(m=>m[1]));
  assert.ok(poses.size>20);
  for (const pose of poses) assert.ok(css.includes(`[data-state="${pose}"] .jimmy-photo`),`${pose} has a pose in features.css`);
  const props=new Set([...acts.matchAll(/\['[a-z0-9]+',\d+,'([a-z]+)'/g),...acts.matchAll(/prop:'([a-z]+)'/g)].map(m=>m[1]));
  assert.ok(props.size>=9);
  for (const prop of props) assert.ok(css.includes(`[data-prop="${prop}"]`),`${prop} is drawn`);
});
