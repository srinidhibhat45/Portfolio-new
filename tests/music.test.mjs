import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {chooseOpeningTrack, waitForPlaylist} from '../js/playlist-shuffle.mjs';

test('opening tracks cover the playlist and exclude the previous opener by ID', () => {
  const videos=['first','second','third'];
  assert.deepEqual(chooseOpeningTrack(videos,'first',()=>0),{video:'second',index:1});
  assert.deepEqual(chooseOpeningTrack(videos,'first',()=>.99),{video:'third',index:2});
  assert.deepEqual(chooseOpeningTrack(['third','first','second'],'first',()=>.5),{video:'second',index:2});
  assert.equal(chooseOpeningTrack([],null),null);
  assert.deepEqual(chooseOpeningTrack(['only'],'only'),{video:'only',index:0});
});

test('playlist readiness waits for asynchronous video IDs and times out without playing track zero', async () => {
  let calls=0, waits=0;
  const videos=await waitForPlaylist({getPlaylist:()=>++calls===3?['a','b']:null},{sleep:async()=>waits++});
  assert.deepEqual(videos,['a','b']);assert.equal(waits,2);
  assert.deepEqual(await waitForPlaylist({getPlaylist:()=>[]},{attempts:3,sleep:async()=>{}}),[]);
});

const source=(await readFile('js/music.js','utf8')).replace(/^import .*$/m,'');
function music({stored='first',failStorage=false,playlist=async()=>['first','second','third']}={}) {
  const elements=new Map(), calls=[];let options;
  function element(id){
    if(!elements.has(id))elements.set(id,{hidden:id==='musicPlayerWrap',disabled:false,value:5,dataset:{size:'mini'},listeners:{},classList:{toggle(){}},setAttribute(){},addEventListener(event,handler){this.listeners[event]=handler;},focus(){}});
    return elements.get(id);
  }
  const player={setVolume:n=>calls.push(['volume',n]),getVideoData:()=>({video_id:'second',title:'A song'}),playVideo:()=>calls.push(['resume']),pauseVideo:()=>calls.push(['pause']),playVideoAt:i=>calls.push(['start',i]),setShuffle:v=>calls.push(['shuffle',v]),nextVideo:()=>calls.push(['next'])};
  const doc={getElementById:element,hidden:false,querySelector:()=>null,addEventListener(){}};
  const win={PortfolioPlayConfig:{playlistUrl:'https://music.youtube.com/playlist?list=PL0123456789'},YT:{Player:function(id,config){options=config;return player;},PlayerState:{PLAYING:1,PAUSED:2}}};
  vm.runInNewContext(source,{document:doc,window:win,URL,location:{origin:'http://localhost:8000'},matchMedia:()=>({addEventListener(){}}),setTimeout:()=>1,clearTimeout(){},chooseOpeningTrack:(v,prev)=>chooseOpeningTrack(v,prev,()=>0),waitForPlaylist:playlist,localStorage:{getItem(){if(failStorage)throw Error();return stored;},setItem(k,v){if(failStorage)throw Error();stored=v;}}});
  const settle=async()=>{for(let i=0;i<5;i++)await Promise.resolve();};
  return {calls,element,doc,win,settle,get stored(){return stored;},ready:()=>options.events.onReady(),state:value=>options.events.onStateChange({data:value})};
}

test('music remains opt-in, starts at 5%, selects a fresh song, then shuffles the following tracks', async () => {
  const ui=music();assert.deepEqual(ui.calls,[]);
  ui.element('musicPlay').listeners.click();await ui.settle();ui.ready();await ui.settle();
  assert.deepEqual(ui.calls,[['volume',5],['start',1]]);
  ui.state(1);assert.deepEqual(ui.calls.at(-1),['shuffle',true]);assert.equal(ui.stored,'second');
  ui.element('musicPlay').listeners.click();assert.deepEqual(ui.calls.at(-1),['pause']);
  ui.state(2);ui.element('musicPlay').listeners.click();await ui.settle();
  assert.deepEqual(ui.calls.at(-1),['resume']);
  assert.equal(ui.calls.filter(([action])=>action==='start').length,1);
});

test('storage restrictions do not prevent music; another visit excludes the remembered opener', async () => {
  for(const settings of [{failStorage:true},{stored:'second'}]){
    const ui=music(settings);ui.element('musicPlay').listeners.click();await ui.settle();ui.ready();await ui.settle();
    assert.deepEqual(ui.calls.at(-1),['start',0]);ui.state(1);
  }
});

test('closing during playlist loading cancels playback, and unavailable playlists allow retry', async () => {
  let release;
  const ui=music({playlist:()=>new Promise(resolve=>release=resolve)});
  ui.element('musicPlay').listeners.click();await ui.settle();ui.ready();
  ui.element('musicClose').listeners.click();release(['first','second']);await ui.settle();
  assert.equal(ui.calls.some(([action])=>action==='start'),false);
  const empty=music({playlist:async()=>[]});empty.element('musicPlay').listeners.click();await empty.settle();empty.ready();await empty.settle();
  assert.equal(empty.calls.some(([action])=>action==='start'),false);
  assert.equal(empty.element('musicPlay').disabled,false);
  assert.match(empty.element('musicStatus').textContent,/couldn’t load/);
});
