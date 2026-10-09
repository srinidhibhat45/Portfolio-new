import { getStore } from '@netlify/blobs';
import { createHash, randomUUID } from 'node:crypto';
export const STICKERS=['🙂','💛','✨','🪷','🌴','🌻','☀️','🦋','🎨','🚀','☕','🍀'];
export const STARTERS=['host-note','starter-welcome','starter-smile','starter-lotus','starter-heart','starter-sparkles','starter-palm','starter-flower','starter-stamp'];
export function validatePosition(position){
  if(!position||typeof position!=='object'||Array.isArray(position)||!['x','y','rotation'].every(key=>Number.isFinite(position[key]))||position.x<0||position.x>1400||position.y<0||position.y>900||Math.abs(position.rotation)>15)throw Error('Please keep your mark on the canvas.');
  return {x:position.x,y:position.y,rotation:position.rotation};
}
export function validatePlacement(data){
  if(!data||typeof data.id!=='string'||!(STARTERS.includes(data.id)||/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.id)))throw Error('Please choose a mark on the board.');
  return {id:data.id,position:validatePosition(data.position)};
}

export function validateNote(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw Error('Please send a valid note.');
  const {name='', text='', color, strokes=[],sticker='',position} = data;
  if (typeof name !== 'string' || name.length > 40 || typeof text !== 'string' || text.length > 240 || !['butter','blue','rose','sage'].includes(color)) throw Error('Keep your note under 240 characters and your name under 40.');
  if (!Array.isArray(strokes) || strokes.length > 80) throw Error('That drawing is a little too detailed. Try a simpler doodle.');
  for (const stroke of strokes) {
    if (!Array.isArray(stroke) || stroke.length < 2 || stroke.length > 250) throw Error('Please send a valid drawing.');
    for (const p of stroke) if (!Array.isArray(p) || p.length !== 2 || !p.every(Number.isFinite) || p[0]<0 || p[0]>520 || p[1]<0 || p[1]>320) throw Error('Please send a valid drawing.');
  }
  if(typeof sticker!=='string'||sticker&&!STICKERS.includes(sticker)||[Boolean(text.trim()),Boolean(strokes.length),Boolean(sticker)].filter(Boolean).length!==1)throw Error('Write a note, draw a doodle, or pick a sticker.');
  return {name:name.trim(),text:text.trim(),color,strokes,...(sticker?{sticker}:{}),...(position!==undefined&&position!==null?{position:validatePosition(position)}:{})};
}
const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function handleNotes(request, context, storeFactory = getStore) {
  if (!['GET','POST','PATCH'].includes(request.method)) return reply({error:'Method not allowed.'},405);
  try {
    const store=storeFactory({name:'portfolio-visitor-notes',consistency:'strong'});
    if (request.method==='GET') {
      const {blobs}=await store.list({prefix:'notes/'});
      // Site-scoped storage survives deploys; every saved mark belongs on the shared board.
      const keys=blobs.map(b=>b.key).sort();
      const notes=(await Promise.all(keys.map(key=>store.get(key,{type:'json'})))).filter(Boolean);
      const {blobs:placements}=await store.list({prefix:'layout/'});
      const layout={};await Promise.all(placements.map(async blob=>{const position=await store.get(blob.key,{type:'json'});if(position)layout[blob.key.slice(7)]=position;}));
      return reply({notes,layout});
    }
    if (request.headers.get('origin') !== new URL(request.url).origin) return reply({error:'Please pin your note from the portfolio.'},403);
    if (!request.headers.get('content-type')?.startsWith('application/json')) return reply({error:'Please send a valid note.'},415);
    const body=await request.text();if(body.length>180000)return reply({error:'This note is too large.'},413);
    if(request.method==='PATCH'){
      let placement;try{placement=validatePlacement(JSON.parse(body));}catch(e){return reply({error:e.message},400);}
      if(!STARTERS.includes(placement.id)){
        const {blobs}=await store.list({prefix:'notes/'});
        if(!blobs.some(blob=>blob.key.endsWith('-'+placement.id)))return reply({error:'This mark could not be found.'},404);
      }
      await store.setJSON('layout/'+placement.id,placement.position);
      return reply(placement);
    }
    let note;try{note=validateNote(JSON.parse(body));}catch(e){return reply({error:e.message},400);}
    const now=Date.now();
    // Reserve a short posting window atomically; no IP addresses are stored.
    const key='rate/'+createHash('sha256').update(context.ip+'|'+new URL(request.url).host+(note.sticker?'|sticker':'')).digest('hex');
    const previous=await store.getWithMetadata(key,{type:'json'});
    if(previous && now-previous.data.last<(note.sticker?500:30000))return reply({error:note.sticker?'Give your sticker a moment to settle.':'Give your last note a moment to settle. Try again in thirty seconds.'},429);
    const reserved=await store.setJSON(key,{last:now},previous?{onlyIfMatch:previous.etag}:{onlyIfNew:true});
    if(!reserved.modified)return reply({error:'Please wait a moment before pinning another note.'},429);
    note={...note,id:randomUUID(),createdAt:new Date(now).toISOString()};
    await store.setJSON('notes/'+String(9999999999999-now)+'-'+note.id,note,{onlyIfNew:true});
    return reply({note},201);
  } catch (_) {return reply({error:'The board is resting. Your note has not been pinned; please try again shortly.'},503);}
}
export default handleNotes;
export const config={path:'/api/notes'};
