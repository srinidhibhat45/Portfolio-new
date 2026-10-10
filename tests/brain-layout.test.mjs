import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const context=vm.createContext({window:{}});
for(const path of ['js/site-data.js','js/project-media.js','js/brain-data.js','js/brain-layout.js']) vm.runInContext(readFileSync(path,'utf8'),context);
const map=context.window.BRAIN_MAP;
const create=context.window.createBrainLayout;
const members=scope=>map.nodes.filter(n=>n.topic&&(!scope||n.topic===scope));
const layout=options=>create(map,{mobile:false,scope:'',query:'',selected:'me',found:members(),...options});

function assertReadable(plan,mobile){
  const entries=Array.from(plan.points);
  for(const [id,p] of entries){
    assert.ok(p.x>=50&&p.x<=plan.width-50,`${id} is inside horizontal bounds`);
    assert.ok(p.y>=50&&p.y<=plan.height-30,`${id} is inside vertical bounds`);
  }
  for(let i=0;i<entries.length;i++) for(let j=i+1;j<entries.length;j++){
    const [a,p]=entries[i],[b,q]=entries[j];
    const horizontal=mobile?232:plan.mode==='overview'?202:280;
    assert.ok(Math.abs(p.x-q.x)>=horizontal||Math.abs(p.y-q.y)>=105,`${a} and ${b} have room for separate labels`);
  }
  for(const e of plan.edges) assert.ok(plan.points.has(e.from)&&plan.points.has(e.to),'every drawn edge has visible endpoints');
}

test('the overview has four branches and representative nodes, without showing the entire dataset',()=>{
  for(const mobile of [false,true]){
    const plan=layout({mobile});
    assert.equal(plan.mode,'overview');
    assert.equal(plan.points.size,mobile?9:17);
    for(const t of map.topics){
      assert.ok(plan.points.has(t.id));
      assert.ok(plan.edges.some(e=>e.from==='me'&&e.to===t.id));
    }
    assertReadable(plan,mobile);
  }
});

test('each theme reveals every member on both phone and desktop layouts',()=>{
  for(const mobile of [false,true]) for(const topic of map.topics){
    const found=members(topic.id);
    const plan=layout({mobile,scope:topic.id,selected:topic.id,found});
    assert.equal(plan.mode,'theme');
    assert.equal(plan.points.size,found.length+2);
    for(const n of found) assert.ok(plan.points.has(n.id),n.name);
    assertReadable(plan,mobile);
  }
});

test('selecting Yuva reveals its six pillars, volunteer website and home connection',()=>{
  for(const mobile of [false,true]){
    const plan=layout({mobile,scope:'community',selected:'yuva-volunteer',found:members('community')});
    assert.equal(plan.mode,'connection');
    assert.ok(plan.points.has('yuva-volunteer'));
    for(const node of map.nodes.filter(n=>n.kind==='pillar')) assert.ok(plan.points.has(node.id),node.name);
    assert.ok(plan.points.has('goa'));
    assert.ok(plan.points.has(map.nodes.find(n=>n.name==='Yuva Panaji').id));
    assert.equal(plan.points.size,11);
    assertReadable(plan,mobile);
  }
});

test('search results and empty results produce bounded layouts without unrelated nodes',()=>{
  const found=map.nodes.filter(n=>['Earthlog','HexChess','OneSpace'].includes(n.name));
  for(const mobile of [false,true]){
    const plan=layout({mobile,query:'test',found});
    assert.equal(plan.mode,'search');
    assert.equal(plan.points.size,found.length+1);
    for(const n of found) assert.ok(plan.points.has(n.id));
    assertReadable(plan,mobile);
    const empty=layout({mobile,query:'no results',found:[]});
    assert.equal(empty.points.size,1);
    assert.equal(empty.edges.length,0);
  }
});
