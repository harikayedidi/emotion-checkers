import { useState, type CSSProperties } from "react";
import { rows, initialPosition, moves, wins } from "../rules";

const moods = [
  ["Joy", "😄", "#ffc548"], ["Fear", "😨", "#af88ff"], ["Anger", "😡", "#ff705e"],
  ["Sadness", "😢", "#60acff"], ["Disgust", "🤢", "#9ad981"], ["Calm", "😌", "#69dcd2"],
];
const seats: Record<number, number[]> = {2: [0, 3], 3: [0, 2, 4], 4: [1, 2, 4, 5], 6: [0, 1, 2, 3, 4, 5]};
const tint = (camp: number) => ({"--tint": moods[camp]?.[2] ?? "#847697"} as CSSProperties);

export default function Board() {
  const [teams, setTeams] = useState(seats[6]);
  const [board, setBoard] = useState(() => initialPosition(teams));
  const [turn, setTurn] = useState(0);
  const [selected, select] = useState("");
  const [path, setPath] = useState<string[]>([]);
  const [long, setLong] = useState(false);
  const [winner, setWinner] = useState(false);
  const team = teams[turn];
  const legal = moves(board, selected, long, path.length > 0);
  for (const seen of path) legal.delete(seen);
  function next() {
    setTurn((turn + 1) % teams.length);
    select("");
    setPath([]);
  }
  function restart(count: number) {
    const active = seats[count];
    setTeams(active);
    setBoard(initialPosition(active));
    setTurn(0);
    select("");
    setPath([]);
    setWinner(false);
  }
  function play(id: string) {
    if (winner) return;
    if (!path.length && board[id] === team) {
      select(selected === id ? "" : id);
      return;
    }
    const type = legal.get(id);
    if (!type) return;
    const updated = {...board, [selected]: undefined, [id]: team};
    setBoard(updated);
    if (wins(updated, team)) {
      setWinner(true); select(""); setPath([]); return;
    }
    const visited = [...path, selected];
    if (type === 'hop' && [...moves(updated, id, long, true).keys()].some(k => !visited.includes(k))) {
      setPath(visited); select(id);
    } else next();
  }
  return <main>
    <header><span className="brand-mark" aria-hidden="true">✦</span><h1>Emotion Checkers</h1><details className="help"><summary>How to play</summary><div>Race your ten marbles to the opposite point of the star. Step to an empty neighbor or hop over one marble of any color. Chain hops with the same marble, then end your turn. Pieces stay on the board. Once in your goal, stay inside it. Optional long jumps cross one centered marble with equal clear space on both sides.</div></details></header>
    <div className="table">
      <section className="tray" aria-label="Chinese checkers board"><div className="disc"><div className="holes">
        {rows.map((row, r) => <div className="row" key={r}>{row.map((c, i) => {
          const piece = board[c.id];
          const own = piece === team && (!path.length || selected === c.id);
          const label = piece !== undefined ? moods[piece][0] : legal.get(c.id) || "Empty";
          return <button key={c.id} style={tint(c.camp)} className={'hole' + (legal.has(c.id) ? ' legal' : '') + (selected === c.id ? ' selected' : '')}
            disabled={winner || (!own && !legal.has(c.id))} aria-label={label + ', row ' + (r+1) + ', hole ' + (i+1)}
            aria-pressed={piece === undefined ? undefined : selected === c.id} onClick={() => play(c.id)}>
            {piece !== undefined && <span className="marble" style={tint(piece)}>{moods[piece][1]}</span>}</button>;
        })}</div>)}
      </div></div></section>
      <aside><div className="turn" aria-live="polite"><p className="eyebrow">{winner ? "Winner" : "At the table"}</p>
      <h2>{moods[team][1]} {moods[team][0]}{winner ? " wins!" : "’s turn"}</h2>
      <p>{winner ? "All ten marbles made it home." : path.length ? "Hop again with this marble, or end your turn." : selected ? legal.size ? "Choose a glowing spot to land." : "This marble is blocked. Pick another." : "Pick a marble to see where it can go."}</p></div>
      {path.length > 0 && <button className="action" onClick={next}>End turn</button>}
      <div className="teams">{teams.map(t => <div key={t}><i style={tint(t)} />{moods[t][0]}<small>{rows.flat().filter(c => c.camp === (t+3)%6 && board[c.id] === t).length}/10</small></div>)}</div>
      <label className="setting"><input type="checkbox" checked={long} disabled={!!path.length} onChange={e => setLong(e.target.checked)}/> Allow long jumps</label>
      <form onSubmit={e => {e.preventDefault(); restart(Number(new FormData(e.currentTarget).get("players")));}}>
        <label>Players <select name="players" defaultValue="6">{Object.keys(seats).map(n => <option key={n}>{n}</option>)}</select></label><button className="action">New game</button>
      </form></aside>
    </div></main>;
}
