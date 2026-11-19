import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialPosition, moves, rows, wins } from '../src/rules.ts';

test('121 distinct holes and ten marbles per camp', () => {
  assert.equal(new Set(rows.flat().map(c => c.id)).size, 121);
  for (let t = 0; t < 6; t++) assert.equal(Object.keys(initialPosition([t])).length, 10);
});

test('steps and adjacent hops in all six directions preserve jumped marbles', () => {
  for (const [x,y] of [[2,0],[1,1],[-1,1],[-2,0],[-1,-1],[1,-1]]) {
    const middle = [x,8+y].join(',');
    const end = [2*x,8+2*y].join(',');
    const board = {'0,8': 0};
    assert.equal(moves(board,'0,8',false).get(middle),'step');
    assert.equal(moves(board,'0,8',true).size,0);
    board[middle] = 3;
    assert.equal(moves(board,'0,8',false).get(end),'hop');
    assert.equal(board[middle],3);
    board[end] = 2;
    assert.ok(!moves(board,'0,8',true).has(end));
  }
});

test('hops always require an adjacent marble', () => {
  const board = {'0,8': 1, '4,8': 3};
  assert.ok(!moves(board,'0,8',false).has('8,8'));
  assert.ok(!moves(board,'0,8',true).has('8,8'));
  assert.ok(!moves(board,'0,8',true).has('6,8'));
  board['6,8'] = 5;
  assert.ok(!moves(board,'0,8',true).has('8,8'));
});

test('marbles stay in their goal and all ten are needed to win', () => {
  const board = {'-3,13': 0};
  assert.ok(!moves(board,'-3,13',false).has('-4,12'));
  assert.equal(moves(board,'-3,13',false).get('-1,13'),'step');
  assert.ok(!wins(board,0));
  for (const cell of rows.flat().filter(c => c.camp === 3)) board[cell.id] = 0;
  assert.ok(wins(board,0));
});

test('a chain can change direction, stop early, and undo back to its origin', async () => {
  const {newMatch,applyMove}=await import('../src/match.ts');
  const game={...newMatch(2,true),board:{'0,8':0,'2,8':3,'5,9':3}};
  const first={from:'0,8',to:'4,8'};
  const hop=applyMove(game,first);
  assert.equal(hop.chain,'4,8');
  assert.equal(applyMove(hop,{from:'4,8',to:'0,8'}),null);
  for(const result of [hop,applyMove(hop,{end:true}),applyMove(hop,{from:'4,8',to:'6,10'})]){
    const restored=applyMove(result,{undo:true});
    assert.deepEqual(restored.board,game.board);
    assert.equal(restored.turn,0);
    assert.equal(restored.chain,'');
    assert.equal(applyMove(restored,{undo:true}),null);
  }
  assert.equal(applyMove({...game,long:false},first).turn,1);
  assert.equal(applyMove(game,{from:'0,8',to:'6,10'}),null);
});
