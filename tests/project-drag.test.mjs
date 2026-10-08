import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const context={window:{}};
vm.runInNewContext(readFileSync('js/project-drag.js','utf8'),context);

function surface(reduced=false){
  const listeners=new Map(),documentListeners=new Map(),classes=new Set(),captures=new Set();
  const panel={
    clientWidth:600,scrollWidth:1600,scrollLeft:0,
    children:[0,400,800,1200].map(offsetLeft=>({offsetLeft,hidden:false})),
    classList:{add:name=>classes.add(name),remove:name=>classes.delete(name)},
    addEventListener(name,fn){listeners.set(name,fn);},
    ownerDocument:{addEventListener(name,fn){documentListeners.set(name,fn);}},
    setPointerCapture:id=>captures.add(id),hasPointerCapture:id=>captures.has(id),releasePointerCapture:id=>captures.delete(id),
    scrollTo(options){this.scrollLeft=options.left;this.lastScroll=options;}
  };
  context.window.enableProjectDrag(panel,()=>reduced);
  function send(name,options={},outside=false){
    const event={pointerId:1,pointerType:'mouse',button:0,clientX:500,clientY:100,detail:1,
      preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;},...options};
    (outside?documentListeners:listeners).get(name)?.(event);
    return event;
  }
  return {panel,classes,captures,send};
}

test('drag follows the mouse, settles on a card, and does not open its link',()=>{
  const s=surface();s.send('pointerdown');s.send('pointermove',{clientX:150});
  assert.equal(s.panel.scrollLeft,350);
  assert.ok(s.classes.has('is-dragging'));
  assert.ok(s.captures.has(1));
  s.send('pointerup',{clientX:150});
  assert.equal(s.panel.scrollLeft,400);
  assert.equal(s.panel.lastScroll.behavior,'smooth');
  assert.equal(s.classes.has('is-dragging'),false);
  assert.equal(s.captures.size,0);
  const click=s.send('click');assert.ok(click.prevented&&click.stopped);
});

test('small movements, modified clicks and touch retain normal link behaviour',()=>{
  for(const options of [{},{ctrlKey:true},{metaKey:true},{button:2},{pointerType:'touch'}]){
    const s=surface();s.send('pointerdown',options);s.send('pointermove',{clientX:Object.keys(options).length?150:495,...options});s.send('pointerup',options);
    assert.equal(s.panel.scrollLeft,0);
    assert.equal(s.send('click').prevented,undefined);
    assert.equal(s.captures.size,0);
  }
});

test('release outside the row clamps to the end and respects reduced motion',()=>{
  const s=surface(true);s.send('pointerdown');s.send('pointermove',{clientX:-2000});
  assert.equal(s.panel.scrollLeft,1000);
  s.send('pointerup',{},true);
  assert.equal(s.panel.scrollLeft,1000);
  assert.equal(s.panel.lastScroll.behavior,'instant');
  assert.equal(s.classes.has('is-dragging'),false);
  assert.equal(s.captures.size,0);
});

test('keyboard activation and the next real click work immediately after a drag',()=>{
  const s=surface();s.send('pointerdown');s.send('pointermove',{clientX:150});s.send('pointerup');
  assert.equal(s.send('click',{detail:0}).prevented,undefined);
  s.send('pointerdown');s.send('pointerup');
  assert.equal(s.send('click').prevented,undefined);
});
