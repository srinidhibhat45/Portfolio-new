/* Small, deterministic rules shared by the playroom and its tests. */
export function handValue(hand) {
  let value=0,aces=0;
  for(const card of hand){if(card.rank==='A'){value+=11;aces++;}else value+=['J','Q','K'].includes(card.rank)?10:Number(card.rank);}
  while(value>21&&aces){value-=10;aces--;}
  return value;
}
export function cardResult(player,bot){const p=handValue(player),b=handValue(bot);return p>21?'bot':b>21?'you':p===b?'draw':p>b?'you':'bot';}
export function newDeck(random=Math.random){const cards=[];for(const suit of ['♠','♥','♣','♦'])for(const rank of ['A','2','3','4','5','6','7','8','9','10','J','Q','K'])cards.push({rank,suit});for(let i=cards.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]];}return cards;}
export function newPens(){return [{x:188,y:242,a:-.2,vx:0,vy:0,w:0,id:'you'},{x:456,y:180,a:.28,vx:0,vy:0,w:0,id:'bot'}];}
export const TABLE={width:640,height:420,length:104,radius:9};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function segment(p){const dx=Math.cos(p.a)*TABLE.length/2,dy=Math.sin(p.a)*TABLE.length/2;return [{x:p.x-dx,y:p.y-dy},{x:p.x+dx,y:p.y+dy}];}
// Closest points between two line segments, including parallel pens.
function closest(a,b){const d1={x:a[1].x-a[0].x,y:a[1].y-a[0].y},d2={x:b[1].x-b[0].x,y:b[1].y-b[0].y},r={x:a[0].x-b[0].x,y:a[0].y-b[0].y};const dot=(p,q)=>p.x*q.x+p.y*q.y;const aa=dot(d1,d1),ee=dot(d2,d2),bb=dot(d1,d2),cc=dot(d1,r),ff=dot(d2,r),den=aa*ee-bb*bb;let s=den?clamp((bb*ff-cc*ee)/den,0,1):0,t=(bb*s+ff)/ee;if(t<0){t=0;s=clamp(-cc/aa,0,1);}else if(t>1){t=1;s=clamp((bb-cc)/aa,0,1);}return [{x:a[0].x+d1.x*s,y:a[0].y+d1.y*s},{x:b[0].x+d2.x*t,y:b[0].y+d2.y*t}];}
export function stepPens(pens,dt){
  dt=clamp(dt,0,1/60);
  for(const p of pens){p.x+=p.vx*dt;p.y+=p.vy*dt;p.a+=p.w*dt;const friction=Math.exp(-1.7*dt);p.vx*=friction;p.vy*=friction;p.w*=Math.exp(-2.5*dt);if(Math.hypot(p.vx,p.vy)<3){p.vx=p.vy=0;}if(Math.abs(p.w)<.025)p.w=0;}
  const [a,b]=pens,[pa,pb]=closest(segment(a),segment(b));let dx=pb.x-pa.x,dy=pb.y-pa.y,d=Math.hypot(dx,dy);
  if(d<TABLE.radius*2){if(d<.001){dx=b.x-a.x;dy=b.y-a.y;d=Math.hypot(dx,dy)||1;}const nx=dx/d,ny=dy/d,overlap=TABLE.radius*2-d+.1;a.x-=nx*overlap/2;a.y-=ny*overlap/2;b.x+=nx*overlap/2;b.y+=ny*overlap/2;
    const ra={x:pa.x-a.x,y:pa.y-a.y},rb={x:pb.x-b.x,y:pb.y-b.y},rvx=b.vx-b.w*rb.y-a.vx+a.w*ra.y,rvy=b.vy+b.w*rb.x-a.vy-a.w*ra.x,vel=rvx*nx+rvy*ny;
    if(vel<0){const ca=ra.x*ny-ra.y*nx,cb=rb.x*ny-rb.y*nx,inertia=TABLE.length**2/12,j=-(1+.72)*vel/(2+(ca*ca+cb*cb)/inertia);a.vx-=j*nx;a.vy-=j*ny;b.vx+=j*nx;b.vy+=j*ny;a.w-=j*ca/inertia;b.w+=j*cb/inertia;}
  }
  const out=p=>p.x<0||p.x>TABLE.width||p.y<0||p.y>TABLE.height;
  return out(a)&&out(b)?'draw':out(a)?'bot':out(b)?'you':null;
}
export function pensMoving(pens){return pens.some(p=>Math.hypot(p.vx,p.vy)>0||Math.abs(p.w)>0);}
export function shootPen(p,dx,dy){const length=Math.hypot(dx,dy);if(length<8)return false;const power=clamp(length*5,80,670);p.vx=dx/length*power;p.vy=dy/length*power;p.w=clamp((dx*Math.sin(p.a)-dy*Math.cos(p.a))/length*.7,-.7,.7);return true;}
// A casual profile with shallow tactics and occasional near-best moves.
// 1100 is a design target; this custom engine has not been rated in tournament play.
export const CHESS_PROFILE={targetElo:1100,depth:2,variation:45,inaccuracyChance:.16,inaccuracyLimit:115};
export function chessChoice(chess,depth=2,options={}){
 const random=options.random||Math.random;
 const values={p:100,n:320,b:330,r:500,q:900,k:0};
 function score(){if(chess.isCheckmate())return chess.turn()==='b'?-100000:100000;if(chess.isDraw())return 0;let n=0;for(const row of chess.board())for(const p of row)if(p){const file=p.square.charCodeAt(0)-97,rank=Number(p.square[1])-1,center=3.5-Math.max(Math.abs(file-3.5),Math.abs(rank-3.5));const advancement=p.color==='b'?6-rank:rank-1;const position=['n','b'].includes(p.type)?center*12:p.type==='p'?center*6+advancement*5:p.type==='k'&&['g1','c1','g8','c8'].includes(p.square)?35:0;n+=(p.color==='b'?1:-1)*(values[p.type]+position);}return n;}
 function search(d,alpha,beta){if(!d||chess.isGameOver())return score();const max=chess.turn()==='b';let best=max?-Infinity:Infinity;const moves=chess.moves({verbose:true}).sort((a,b)=>(values[b.captured]||0)-(values[a.captured]||0));for(const m of moves){chess.move(m);const v=search(d-1,alpha,beta);chess.undo();best=max?Math.max(best,v):Math.min(best,v);if(max)alpha=Math.max(alpha,best);else beta=Math.min(beta,best);if(beta<=alpha)break;}return best;}
 const moves=chess.moves({verbose:true});if(!moves.length)return null;const max=chess.turn()==='b',ranked=[];for(const m of moves){chess.move(m);const v=search(depth-1,-Infinity,Infinity);chess.undo();ranked.push({move:m,value:max?v:-v});}ranked.sort((a,b)=>b.value-a.value);let chosen=ranked[0].move;
 if(options.profile==='casual1100'&&Math.abs(ranked[0].value)<90000){const margin=random()<CHESS_PROFILE.inaccuracyChance?CHESS_PROFILE.inaccuracyLimit:CHESS_PROFILE.variation;const candidates=ranked.filter(m=>ranked[0].value-m.value<=margin);chosen=candidates[Math.floor(random()*candidates.length)].move;}
 return {from:chosen.from,to:chosen.to,...(chosen.promotion?{promotion:chosen.promotion}:{})};
}
