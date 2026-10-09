import test from 'node:test';
import assert from 'node:assert/strict';
import {validateNote, validatePosition, validatePlacement, handleNotes} from '../netlify/functions/notes.mjs';
const valid={name:'  Visitor ',text:'  Hello, Srinidhi!  ',color:'blue',strokes:[]};
test('normalizes written notes without interpreting HTML',()=>{
 assert.deepEqual(validateNote(valid),{name:'Visitor',text:'Hello, Srinidhi!',color:'blue',strokes:[]});
 assert.equal(validateNote({...valid,text:'<script>example</script>'}).text,'<script>example</script>');
});
test('accepts bounded vector doodles',()=>assert.deepEqual(validateNote({...valid,text:'',strokes:[[[0,0],[520,320]]]}).strokes,[[[0,0],[520,320]]]));
test('stickers and canvas positions are bounded and allowlisted',()=>{
 const p={x:520,y:320,rotation:-5};
 assert.deepEqual(validateNote({...valid,text:'',sticker:'🪷',position:p}).position,p);
 assert.deepEqual(validatePlacement({id:'host-note',position:p}),{id:'host-note',position:p});
 for(const position of [null,{}, {x:-1,y:0,rotation:0},{x:0,y:901,rotation:0},{x:0,y:0,rotation:16},{x:true,y:0,rotation:0},{x:Infinity,y:0,rotation:0}])assert.throws(()=>validatePosition(position));
 for(const payload of [{...valid,sticker:'🙂'},{...valid,text:'',sticker:'<script>'},{...valid,position:false}])assert.throws(()=>validateNote(payload));
 assert.throws(()=>validatePlacement({id:'../notes/private',position:p}));
});
test('rejects ambiguous, empty, oversized and malformed notes',()=>{
 for(const payload of [null,[],{}, {...valid,text:'  '}, {...valid,text:'x'.repeat(241)}, {...valid,name:'x'.repeat(41)}, {...valid,color:'url(evil)'}, {...valid,strokes:[[[0,0],[2,2]]]}, {...valid,text:'',strokes:[[[NaN,0],[2,2]]]}, {...valid,text:'',strokes:[[[-1,0],[2,2]]]}, {...valid,text:'',strokes:[[[0,0],[521,2]]]}, {...valid,text:'',strokes:[[[0,0]]]}, {...valid,text:'',strokes:[Array(251).fill([1,1])]}]) assert.throws(()=>validateNote(payload));
});

test('hosted handler saves, reads, rate limits and rejects external origins with a memory store',async()=>{
 const saved=new Map();let etag=0;
 const store={
  async list({prefix}){return {blobs:[...saved.keys()].filter(k=>k.startsWith(prefix)).map(key=>({key}))};},
  async get(key){return saved.get(key)?.data||null;},
  async getWithMetadata(key){return saved.get(key)||null;},
  async setJSON(key,data,options={}){
   const prev=saved.get(key);
   if(options.onlyIfNew&&prev || options.onlyIfMatch&&prev?.etag!==options.onlyIfMatch)return {modified:false};
   saved.set(key,{data,etag:String(++etag)});return {modified:true};
  }
 };
 const endpoint='https://portfolio.example/api/notes';
 const post=(body,origin='https://portfolio.example')=>new Request(endpoint,{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});
 const run=req=>handleNotes(req,{ip:'test-client'},()=>store);
 const first=await run(post(valid));assert.equal(first.status,201);const note=(await first.json()).note;
 const get=await run(new Request(endpoint));assert.equal(get.status,200);assert.equal((await get.json()).notes[0].id,note.id);
 assert.equal((await run(post(valid))).status,429);
 assert.equal((await run(post(valid,'https://external.example'))).status,403);
 assert.equal((await run(post({...valid,text:''}))).status,400);
 assert.equal((await run(new Request(endpoint,{method:'DELETE'}))).status,405);
 assert.equal([...saved.keys()].filter(k=>k.startsWith('notes/')).length,1);
 const patch=(body,origin='https://portfolio.example')=>new Request(endpoint,{method:'PATCH',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});
 const position={x:480,y:280,rotation:5};
 assert.equal((await run(patch({id:note.id,position}))).status,200);
 const updated=await (await run(new Request(endpoint))).json();
 assert.deepEqual(updated.notes[0],note,'moving never rewrites the original visitor content');
 assert.deepEqual(updated.layout[note.id],position);
 assert.equal((await run(patch({id:'host-note',position}))).status,200);
 assert.equal((await run(patch({id:note.id,position},'https://external.example'))).status,403);
 assert.equal((await run(patch({id:'00000000-0000-0000-0000-000000000000',position}))).status,404);
 assert.equal((await run(patch({id:note.id,position:{x:0,y:0,rotation:99}}))).status,400);
 const sticker=await run(post({...valid,text:'',sticker:'🙂',position}));
 assert.equal(sticker.status,201);
 assert.equal((await sticker.json()).note.sticker,'🙂');
});

test('all shared notes remain visible beyond 80 marks and across visitors and deploys',async()=>{
 const saved=new Map();
 const notes=Array.from({length:125},(_,i)=>({
  ...valid,id:`00000000-0000-4000-8000-${String(i).padStart(12,'0')}`,
  text:`Visitor note ${i}`,createdAt:new Date(1600000000000+i).toISOString()
 }));
 notes.forEach((note,i)=>saved.set(`notes/${String(i).padStart(4,'0')}-${note.id}`,note));
 const options=[];
 const store={
  async list({prefix}){return {blobs:[...saved.keys()].filter(key=>key.startsWith(prefix)).map(key=>({key}))};},
  async get(key){return saved.get(key)||null;},
  async setJSON(key,value){saved.set(key,value);return {modified:true};}
 };
 const factory=option=>{options.push(option);return store;};
 const endpoint='https://portfolio.example/api/notes';
 for(const ip of ['first-visitor','another-visitor']){
  const response=await handleNotes(new Request(endpoint),{ip},factory);
  assert.equal(response.status,200);
  assert.deepEqual((await response.json()).notes,notes);
 }
 assert.ok(options.every(option=>option.name==='portfolio-visitor-notes'&&!('deployID' in option)));
 const position={x:460,y:330,rotation:2},oldest=notes.at(-1);
 const patch=new Request(endpoint,{method:'PATCH',headers:{origin:'https://portfolio.example','content-type':'application/json'},body:JSON.stringify({id:oldest.id,position})});
 assert.equal((await handleNotes(patch,{ip:'another-visitor'},factory)).status,200);
 const again=await (await handleNotes(new Request(endpoint),{ip:'returning-visitor'},factory)).json();
 assert.equal(again.notes.length,125);
 assert.deepEqual(again.layout[oldest.id],position);
 assert.deepEqual(again.notes.at(-1),oldest);
});
