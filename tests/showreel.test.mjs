import test from 'node:test';
import assert from 'node:assert/strict';
import {youtubeVideoId,initShowreel} from '../js/showreel.mjs';

test('showreel accepts supported public YouTube links and rejects unrelated hosts and malformed IDs', () => {
  for(const url of ['https://youtu.be/abcD_123-45?si=share','https://www.youtube.com/watch?v=abcD_123-45','https://youtube.com/shorts/abcD_123-45','https://www.youtube.com/embed/abcD_123-45'])assert.equal(youtubeVideoId(url),'abcD_123-45');
  for(const url of ['', 'javascript:alert(1)', 'https://youtube.com.evil.test/watch?v=abcD_123-45','http://youtu.be/abcD_123-45','https://youtu.be/short','https://youtube.com/playlist?list=PL0123456789'])assert.equal(youtubeVideoId(url),null);
});

function setup(){
  let callback,frame,paused=false;
  const elements={showreel:{dataset:{state:'pending'}},showreelPlay:{hidden:true,addEventListener:(event,fn)=>callback=fn},showreelPoster:{replaceChildren:f=>frame=f},showreelStatus:{}};
  const doc={getElementById:id=>elements[id],createElement:()=>({focus(){this.focused=true;}}),dispatchEvent:event=>paused=event.detail.open};
  return {doc,elements,click:()=>callback(),get frame(){return frame;},get paused(){return paused;}};
}

test('an unconfigured showreel is honest, has no active play control, and makes no embed requests', () => {
  const ui=setup();initShowreel(ui.doc,{showreelUrl:''});
  assert.equal(ui.elements.showreel.dataset.state,'pending');assert.equal(ui.elements.showreelPlay.hidden,true);assert.equal(ui.frame,undefined);
});

test('a configured showreel loads a privacy-enhanced video only on click and pauses background music', () => {
  const ui=setup();initShowreel(ui.doc,{showreelUrl:'https://youtu.be/abcD_123-45'});
  assert.equal(ui.elements.showreel.dataset.state,'ready');assert.equal(ui.elements.showreelPlay.hidden,false);assert.equal(ui.frame,undefined);
  ui.click();assert.equal(ui.paused,true);assert.equal(ui.frame.focused,true);assert.equal(ui.frame.allowFullscreen,true);
  assert.equal(ui.frame.src,'https://www.youtube-nocookie.com/embed/abcD_123-45?autoplay=1&playsinline=1&rel=0');assert.match(ui.frame.title,/Srinidhi Bhat/);
});
