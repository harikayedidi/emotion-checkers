// x is measured in half-columns so every lattice position has integer coordinates.
const widths = [1, 2, 3, 4, 13, 12, 11, 10, 9, 10, 11, 12, 13, 4, 3, 2, 1];
const directions = [[2, 0], [1, 1], [-1, 1], [-2, 0], [-1, -1], [1, -1]];
const key = (x: number, y: number) => x + "," + y;
export const rows = widths.map((width, y) => Array.from({length: width}, (_, i) => {
  const x = 2 * i - width + 1;
  let camp = -1;
  if (y < 4) camp = 0;
  else if (y > 12) camp = 3;
  else {
    const wing = Math.abs(y - 8);
    if (i < wing) camp = y < 8 ? 5 : 4;
    if (i >= width - wing) camp = y < 8 ? 1 : 2;
  }
  return { x, y, camp, id: key(x, y) };
}));
const cells = new Map(rows.flat().map(cell => [cell.id, cell]));
export type Position = Record<string, number | undefined>;
export function initialPosition(teams: number[]): Position {
  return Object.fromEntries(rows.flat().filter(c => teams.includes(c.camp)).map(c => [c.id, c.camp]));
}
export function wins(board: Position, team: number) {
  return rows.flat().filter(c => c.camp === (team + 3) % 6).every(c => board[c.id] === team);
}
export function moves(board: Position, from: string, hopsOnly = false) {
  const result = new Map<string, 'step' | 'hop'>();
  const start = cells.get(from);
  const team = board[from];
  if (!start || team === undefined) return result;
  const goal = (team + 3) % 6;
  for (const [dx, dy] of directions) {
    const at = (n: number) => key(start.x + dx * n, start.y + dy * n);
    const empty = (n: number) => cells.has(at(n)) && board[at(n)] === undefined;
    const allowed = (n: number) => start.camp !== goal || cells.get(at(n))?.camp === goal;
    if (!hopsOnly && empty(1) && allowed(1)) result.set(at(1), 'step');
    if (board[at(1)] !== undefined && empty(2) && allowed(2)) result.set(at(2), 'hop');
  }
  return result;
}
