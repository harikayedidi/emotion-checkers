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
    assert.equal(moves(board,'0,8',false,true).size,0);
    board[middle] = 3;
    assert.equal(moves(board,'0,8',false).get(end),'hop');
    assert.equal(board[middle],3);
    board[end] = 2;
    assert.ok(!moves(board,'0,8',true).has(end));
  }
});

test('long jumps require one centered marble and a clear path', () => {
  const board = {'0,8': 1, '4,8': 3};
  assert.ok(!moves(board,'0,8',false).has('8,8'));
  assert.equal(moves(board,'0,8',true).get('8,8'),'hop');
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
