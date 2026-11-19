import { initialPosition, moves, wins } from "./rules";

export const seats: Record<number, number[]> = {2: [0, 3], 3: [0, 2, 4], 4: [1, 2, 4, 5], 6: [0, 1, 2, 3, 4, 5]};
export type Move = { from: string; to: string } | { end: true };
export function newMatch(count: number, long: boolean) {
  const teams = seats[count];
  return {teams, board: initialPosition(teams), turn: 0, chain: "", path: [] as string[], long, winner: false, last: ""};
}
export type Match = ReturnType<typeof newMatch>;
export function applyMove(game: Match, move: Move): Match | null {
  if (game.winner) return null;
  const next = {...game, last: ""};
  if ("end" in move) {
    if (!game.chain) return null;
    next.last = game.chain;
  } else {
    const {from, to} = move;
    const team = game.teams[game.turn];
    if (game.board[from] !== team || (game.chain && game.chain !== from) || game.path.includes(to)) return null;
    const kind = moves(game.board, from, game.long, !!game.chain).get(to);
    if (!kind) return null;
    next.board = {...game.board, [to]:team};
    delete next.board[from];
    next.winner = wins(next.board, team);
    const visited = [...game.path, from];
    if (!next.winner && kind === 'hop' && [...moves(next.board,to,game.long,true).keys()].some(k => !visited.includes(k))) {
      return {...next, path:visited, chain:to};
    }
    next.last = to;
  }
  return {...next, path:[], chain:"", turn:next.winner ? game.turn : (game.turn+1)%game.teams.length};
}
export type RoomView = { avatars?: Record<number, string>; game: Match; joined: number[]; seat: number; version: number; invite?: string };
