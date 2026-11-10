import {cardResult} from './game-core.mjs';
export const GAME_GUIDES={
 pens:{name:'Pen fight',rules:'Drag your red pen backwards and release to flick it. Knock the gold pen off the desk while keeping yours on. You can also set aim and power below the desk. Both off, or 20 shots without a winner, is a draw.'},
 chess:{name:'Chess',rules:'You play White. Pick a piece, then a highlighted destination. Shri plays Black at a casual ~1100 level. Arrow keys move between squares. Choose a promotion piece when your pawn reaches the last rank.'},
 cards:{name:'Twenty-one',rules:'Get closer to 21 than Shri without going over. Hit adds a card; Stay ends your turn. Face cards count as 10, and aces as 1 or 11. Shri draws to 17. Equal totals are a draw.'},
 rps:{name:'Stone, paper, scissors',rules:'Stone beats scissors, scissors beat paper, and paper beats stone. First to three points wins the match. Ties give neither player a point. Shri commits his choice before you choose.'},
 cricket:{name:'Hand cricket',rules:'You bat first, then bowl. Choose 1–6: the batter’s number becomes runs, unless both hands match — that’s out. Each innings lasts one wicket or six balls. Defend your total when Shri bats. Equal final totals are a draw.'},
 connect:{name:'Connect Four',rules:'You play red counters, marked Y; Shri plays gold, marked S. Choose an open column and your counter drops to the lowest empty space. Connect four horizontally, vertically or diagonally to win. A full board with no four is a draw. On a phone, use the column picker and Drop counter.'},
 dots:{name:'Dots & Boxes',rules:'Choose a line between neighbouring dots. Complete the fourth side of a box to claim it and play again. A shared line can close two boxes at once. You are Y; Shri is S. Claim more of the nine boxes to win.'},
 memory:{name:'Pattern Memory',rules:'This is a solo game. Turn over two tiles at a time. Matching patterns stay face up; different patterns turn back after a moment. Find all six pairs to earn a lotus. The turn count is for your own challenge; there is no timer.'},
 ultimate:{name:'Ultimate XO',rules:'You are X. Win three small boards in a row to win the match. Your chosen square sends Shri to the corresponding numbered board, and his move sends you to yours. A gold outline shows where you can play. If a destination board is finished, choose any open one.'}
};
export function penResultFromSave(state){if(state.phase!=='over')return null;if(['you','bot','draw'].includes(state.result))return state.result;const out=p=>p.x<0||p.x>640||p.y<0||p.y>420;const [you,bot]=state.pens;return out(you)&&out(bot)?'draw':out(you)?'bot':out(bot)?'you':'draw';}
export function outcomeCopy(game,result,state){
 const title=result==='you'?'You win!':result==='bot'?'You lost this round.':'It’s a draw.';
 let detail='',score='';
 if(game==='pens')detail=result==='you'?'His pen left the desk. Yours held its ground.':result==='bot'?'Your pen went flying. The desk is ready for revenge.':'No winner this time. One more flick?';
 if(game==='chess')detail=result==='draw'?'A well-fought game. Shall we go again?':'Checkmate. '+(result==='you'?'A very good move, friend.':'There’s always the rematch.');
 if(game==='cards'){score=`You ${state.you} · Shri ${state.bot}`;detail=state.you>21?'You went over 21. That last card was tempting.':state.bot>21?'Shri went over 21. Nicely played.':result==='draw'?'Matching totals. Call it even.':'The closest hand to 21 takes it.';}
 if(game==='rps'){score=`You ${state.you} — ${state.bot} Shri`;detail='First to three. '+(result==='you'?'Your hands had a plan.':'Shri’s hands had a plan.');}
 if(game==='cricket'){score=`You ${state.you} — ${state.bot} Shri`;detail=result==='you'?'You defended your total. Take a bow.':result==='bot'?'Shri chased it down. Time for another innings?':'Scores level. A proper nail-biter.';}
 if(game==='ultimate'){score=`${state.boards.filter(v=>v==='X').length} boards for you · ${state.boards.filter(v=>v==='O').length} for Shri`;detail=result==='draw'?'The whole board is settled. Neither mind gave in.':'Three boards in a line. '+(result==='you'?'You saw the bigger picture.':'Shri found the connection.');}
 if(game==='connect'){score=state.result==='draw'?'42 counters · no line of four':`${state.cells.filter(Boolean).length} counters played`;detail=result==='draw'?'Every column filled. Shall we clear the board?':result==='you'?'Four red counters in a line. Nicely spotted.':'Four gold counters. A rematch is ready when you are.';}
 if(game==='dots'){score=`You ${state.boxes.filter(v=>v==='you').length} — ${state.boxes.filter(v=>v==='bot').length} Shri`;detail=result==='you'?'The last line was worth waiting for. Most boxes, yours.':'Shri claimed more boxes. Try leaving fewer third sides next time.';}
 if(game==='memory'){score=`6 pairs · ${state.turns} turns`;detail='Every pattern has its partner. Can you find them in fewer turns next time?';}
 return {title,detail,score,reward:result==='you'?'+1 lotus added to your collection':'A rematch is always on the cards.'};
}
