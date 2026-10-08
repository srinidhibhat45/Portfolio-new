import test from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from '../js/vendor/chess.mjs';
import {handValue,newDeck,cardResult,newPens,stepPens,shootPen,pensMoving,chessChoice} from '../js/game-core.mjs';
const hand=(...ranks)=>ranks.map(rank=>({rank,suit:'♠'}));
test('Twenty-one handles flexible aces, busts, ties and a full unique deck',()=>{
 assert.equal(handValue(hand('A','A','9')),21);assert.equal(handValue(hand('A','K','5')),16);assert.equal(cardResult(hand('K','K','2'),hand('9','8')),'bot');assert.equal(cardResult(hand('A','K'),hand('K','Q')),'you');assert.equal(cardResult(hand('A','9'),hand('K','Q')),'draw');const deck=newDeck(()=>.4);assert.equal(deck.length,52);assert.equal(new Set(deck.map(c=>c.rank+c.suit)).size,52);
});
test('pen collisions transfer momentum, settle, and report a pen leaving the desk',()=>{
 const p=newPens();Object.assign(p[0],{x:150,y:200,a:0});Object.assign(p[1],{x:300,y:200,a:0});assert.ok(shootPen(p[0],100,0));let transferred=false,result=null;for(let i=0;i<1400&&!result;i++){result=stepPens(p,1/120);transferred||=p[1].vx>0;}assert.ok(transferred);assert.ok(result==='you'||!pensMoving(p));assert.equal(stepPens([{...p[0],x:-1},{...p[1],x:200}],0),'bot');assert.equal(shootPen(newPens()[0],1,1),false);
});
test('the chess bot returns a legal move without mutating the game',()=>{
 const chess=new Chess();chess.move('e4');const fen=chess.fen(),history=chess.history();const move=chessChoice(chess,2);assert.equal(chess.fen(),fen);assert.deepEqual(chess.history(),history);assert.ok(chess.moves({verbose:true}).some(m=>m.from===move.from&&m.to===move.to));chess.move(move);assert.equal(chess.turn(),'w');
});
test('chess handles checkmate, castling, en passant, and promotion',()=>{
 const mate=new Chess();for(const m of ['f3','e5','g4','Qh4#'])mate.move(m);assert.ok(mate.isCheckmate());assert.equal(chessChoice(mate),null);
 const castle=new Chess('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');castle.move('O-O');assert.equal(castle.get('f1').type,'r');
 const passant=new Chess();for(const m of ['e4','a6','e5','d5','exd6'])passant.move(m);assert.equal(passant.get('d5'),undefined);
 const promote=new Chess('7k/P7/8/8/8/8/8/7K w - - 0 1');promote.move({from:'a7',to:'a8',promotion:'n'});assert.equal(promote.get('a8').type,'n');
});
