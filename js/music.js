/* Opt-in playback. The video stays visible in both sizes while music plays. */
import {chooseOpeningTrack, waitForPlaylist} from './playlist-shuffle.mjs';
const $=id=>document.getElementById(id),panel=$('musicPanel'),wrap=$('musicPlayerWrap'),play=$('musicPlay'),mute=$('musicMute'),next=$('musicNext'),volume=$('musicVolume'),cfg=window.PortfolioPlayConfig||{};
let player,ready=false,loading=false,wanted=false,playing=false,muted=false,apiPromise,loadTimer,id='';
let openingStarted=false,shuffled=false;
const openerKey='portfolio-music-opener';
function previousOpener(){try{return localStorage.getItem(openerKey);}catch{return null;}}
function rememberOpener(video){try{localStorage.setItem(openerKey,video);}catch{}}
try{const url=new URL(cfg.playlistUrl);if(['music.youtube.com','www.youtube.com','youtube.com'].includes(url.hostname))id=url.searchParams.get('list')||'';}catch{}
if(!/^[a-zA-Z0-9_-]{10,100}$/.test(id))id='';
if(id){play.disabled=false;$('musicPlaylistLink').href=cfg.playlistUrl;$('musicPlaylistLink').hidden=false;}
function message(text){$('musicStatus').textContent=text;if(!playing)$('musicTrack').textContent=text;}
function controls(){play.innerHTML=`<span aria-hidden="true">${playing?'Ⅱ':loading?'…':'▶'}</span>`;play.setAttribute('aria-label',playing?'Pause music':loading?'Loading music':'Play music');mute.textContent=muted?'♬':'♪';mute.setAttribute('aria-label',muted?'Unmute music':'Mute music');mute.setAttribute('aria-pressed',String(muted));$('musicRecord').classList.toggle('is-playing',playing);$('musicMinimize').hidden=panel.dataset.size!=='full'&&wrap.hidden;$('musicMinimize').setAttribute('aria-label',panel.dataset.size==='full'?'Minimize music player':'Pause and minimize preview');}
function size(full){panel.dataset.size=full?'full':'mini';$('musicExpand').setAttribute('aria-expanded',String(full));$('musicExpand').hidden=full;controls();}
function pause(){wanted=false;if(ready)player.pauseVideo();playing=false;controls();}
$('musicExpand').addEventListener('click',()=>size(true));$('musicMinimize').addEventListener('click',()=>{if(panel.dataset.size==='full')size(false);else{pause();wrap.hidden=true;message('Paused · ready when you are.');controls();}});
$('musicClose').addEventListener('click',()=>{pause();wrap.hidden=true;size(false);message('A few songs I keep coming back to.');play.focus({preventScroll:true});});
panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();size(false);$('musicExpand').focus();}});
function api(){if(window.YT?.Player)return Promise.resolve();return apiPromise||=new Promise((resolve,reject)=>{const previous=window.onYouTubeIframeAPIReady;window.onYouTubeIframeAPIReady=()=>{previous?.();resolve();};const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.onerror=()=>{apiPromise=null;reject(new Error('YouTube unavailable'));};document.head.append(script);});}
async function startMusic(){
 if(openingStarted){player.playVideo();return;}
 loading=true;play.disabled=true;message('Choosing a song…');controls();
 const videos=await waitForPlaylist(player);
 loading=false;play.disabled=false;
 if(!wanted||wrap.hidden||document.hidden){controls();return;}
 const opening=chooseOpeningTrack(videos,previousOpener());
 if(!opening){wanted=false;message('Playlist couldn’t load. Try Play again or open it on YouTube.');controls();return;}
 openingStarted=true;
 player.playVideoAt(opening.index);
 controls();
}
function create(){loading=true;play.disabled=true;message('Loading YouTube · starts at 5%.');controls();loadTimer=setTimeout(()=>{if(!ready){wanted=false;message('YouTube is taking a moment. Open the playlist ↗');size(true);}},15000);
 api().then(()=>{player=new window.YT.Player('musicPlayer',{width:'100%',height:'200',host:'https://www.youtube-nocookie.com',playerVars:{listType:'playlist',list:id,autoplay:0,playsinline:1,controls:1,origin:location.origin},events:{onReady(){ready=true;loading=false;clearTimeout(loadTimer);player.setVolume(5);[play,mute,next,volume].forEach(b=>b.disabled=false);message('Ready · quietly, at 5%.');if(wanted&&!wrap.hidden&&!document.hidden)startMusic();controls();},onStateChange(e){playing=e.data===window.YT.PlayerState.PLAYING;if(playing&&(wrap.hidden||document.hidden||document.querySelector('dialog[open]'))){pause();return;}if(playing){if(!shuffled){shuffled=true;const video=player.getVideoData()?.video_id;if(video)rememberOpener(video);player.setShuffle(true);}$('musicTrack').textContent=player.getVideoData()?.title||'Playing from my playlist';$('musicStatus').textContent='Shuffle on · playing at your volume.';}else if(e.data===window.YT.PlayerState.PAUSED)message('Paused · ready when you are.');controls();},onAutoplayBlocked(){wanted=false;playing=false;message('Press Play again to start.');controls();},onError(){wanted=false;playing=false;loading=false;play.disabled=false;message('Track unavailable · try Next or the playlist.');controls();}}});}).catch(()=>{clearTimeout(loadTimer);loading=false;wanted=false;play.disabled=false;message('YouTube couldn’t load. Open the playlist ↗');size(true);controls();});}
play.addEventListener('click',()=>{if(!id||loading)return;if(playing){pause();return;}wrap.hidden=false;controls();wanted=true;if(ready){player.setVolume(Number(volume.value));startMusic();}else create();});
mute.addEventListener('click',()=>{if(!ready)return;muted=!muted;muted?player.mute():player.unMute();controls();});next.addEventListener('click',()=>{if(!ready||loading)return;wrap.hidden=false;wanted=true;if(openingStarted)player.nextVideo();else startMusic();});volume.addEventListener('input',()=>{$('musicVolumeValue').value=volume.value+'%';if(ready){player.setVolume(Number(volume.value));if(muted&&Number(volume.value)>0){muted=false;player.unMute();controls();}}});
const phone=matchMedia('(max-width:600px)');
phone.addEventListener('change',event=>{if(event.matches){pause();wrap.hidden=true;size(false);}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});document.addEventListener('portfolio:dialog',e=>{if(e.detail.open)pause();});controls();
