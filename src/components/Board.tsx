import BoardView from "./BoardView";
import { useEffect, useState, type ReactNode, type CSSProperties } from "react";
import { rows, moves } from "../rules";
import { newMatch, applyMove, seats, type Move, type RoomView } from "../match";

const moods = [
  ["Joy", "😄", "#ffc548"], ["Fear", "😨", "#af88ff"], ["Anger", "😡", "#ff705e"],
  ["Sadness", "😢", "#60acff"], ["Disgust", "🤢", "#9ad981"], ["Calm", "😌", "#69dcd2"],
];
const tint = (camp: number) => ({"--tint": moods[camp]?.[2] ?? "#847697"} as CSSProperties);

type Props = {panel?: ReactNode; room?: RoomView | null; online?: boolean; busy?: boolean; onMove?: (move: Move) => void};
export default function Board({panel, room, online, busy, onMove}: Props) {
  const [local, setLocal] = useState(() => newMatch(6, false));
  const game = room?.game ?? local;
  const {teams, board, turn, path, long, winner} = game;
  const [choice, select] = useState("");
  const waiting = online && (!room || room.joined.length < teams.length);
  const mine = !online || (!waiting && room?.seat === teams[turn]);
  const selected = mine ? game.chain || choice : "";
  const [faces, setFaces] = useState(true);
  const [reactions, setReactions] = useState(true);
  const [hints, setHints] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [reaction, setReaction] = useState<{ id: string; face: string } | null>(null);
  useEffect(() => {
    if (!reaction) return;
    const timer = window.setTimeout(() => setReaction(null), 950);
    return () => window.clearTimeout(timer);
  }, [reaction]);
  useEffect(() => {
    select("");
    if (game.last && faces && reactions) {
      setReaction({id:game.last, face:Math.random()<0.5 ? "😉" : "😆"});
    }
    // React to a completed move once, including moves made by another player.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game]);
  const team = teams[turn];
  const legal = moves(board, selected, long, !!game.chain);
  for (const seen of path) legal.delete(seen);
  function act(move: Move) {
    if (!mine || busy || rotating || winner) return;
    if (online) onMove?.(move);
    else {
      const next = applyMove(game,move);
      if (next) setLocal(next);
    }
  }
  function play(id: string) {
    if (!mine || busy || winner || rotating) return;
    if (!game.chain && board[id] === team) {
      select(selected === id ? "" : id);
    } else if (legal.has(id)) act({from:selected,to:id});
  }
  return <main>
    <header><span className="brand-mark" aria-hidden="true">✦</span><h1>Emotion Checkers</h1><details className="help"><summary>How to play</summary><div>Race your ten marbles to the opposite point of the star. Step to an empty neighbor or hop over one marble of any color. Chain hops with the same marble, then end your turn. Pieces stay on the board. Once in your goal, stay inside it. Optional long jumps cross one centered marble with equal clear space on both sides.</div></details></header>
    {panel}
    {(!online || room) && <div className="table">
      <BoardView rotating={rotating}>
        {rows.map((row, r) => <div className="row" key={r}>{row.map((c, i) => {
          const piece = board[c.id];
          const own = piece === team && (!path.length || selected === c.id);
          const label = piece !== undefined ? moods[piece][0] : (hints && legal.get(c.id)) || "Empty";
          return <button key={c.id} style={tint(c.camp)} className={'hole' + (hints && legal.has(c.id) ? ' legal' : '') + (selected === c.id ? ' selected' : '')}
            disabled={!mine || busy || winner || rotating || (!own && !legal.has(c.id))} aria-label={label + ', row ' + (r+1) + ', hole ' + (i+1)}
            aria-pressed={piece === undefined ? undefined : selected === c.id} onClick={() => play(c.id)}>
            {piece !== undefined && <span className="marble" style={tint(piece)}>{faces && <span className="upright"><span className={reactions && reaction?.id === c.id ? "face reacting" : "face"}>{reactions && reaction?.id === c.id ? reaction.face : moods[piece][1]}</span></span>}</span>}</button>;
        })}</div>)}
      </BoardView>
      <aside><div className="turn" aria-live="polite"><p className="eyebrow">{winner ? "Winner" : "At the table"}</p>
      <h2>{moods[team][1]} {moods[team][0]}{winner ? " wins!" : "’s turn"}</h2>
      <p>{winner ? "All ten marbles made it home." : waiting ? "Share the invitation. Play starts when everyone is seated." : !mine ? "Waiting for " + moods[team][0] + " to move." : rotating ? "Drag around the board’s center. Switch off drag and turn to play." : path.length ? "Hop again with this marble, or end your turn." : selected ? legal.size ? (hints ? "Choose a glowing spot to land." : "Choose your landing spot.") : "This marble is blocked. Pick another." : (hints ? "Pick a marble to see where it can go." : "Pick a marble, then choose your move.")}</p></div>
      {mine && path.length > 0 && <button className="action" disabled={rotating || busy} onClick={() => act({end:true})}>End turn</button>}
      <div className="teams">{teams.map(t => <div key={t}><i style={tint(t)} />{moods[t][0]}<small>{rows.flat().filter(c => c.camp === (t+3)%6 && board[c.id] === t).length}/10</small></div>)}</div>
      <label className="setting"><input type="checkbox" checked={long} disabled={online || !!path.length} onChange={e => setLocal({...local,long:e.target.checked,last:""})}/> Allow long jumps</label>
      <label className="setting"><input type="checkbox" checked={faces} onChange={e => {setFaces(e.target.checked); setReaction(null);}}/> Emoji marbles</label>
      <label className="setting"><input type="checkbox" checked={faces && reactions} disabled={!faces} onChange={e => {setReactions(e.target.checked); setReaction(null);}}/> Turn-end reactions</label>
      <label className="setting"><input type="checkbox" checked={hints} onChange={e => setHints(e.target.checked)}/> Show possible moves</label>
      <label className="setting"><input type="checkbox" checked={rotating} onChange={e => setRotating(e.target.checked)}/> Drag and turn board</label>
      {!online && <form onSubmit={e => {e.preventDefault(); setLocal(newMatch(Number(new FormData(e.currentTarget).get("players")),long)); setReaction(null);}}>
        <label>Players <select name="players" defaultValue="6">{Object.keys(seats).map(n => <option key={n}>{n}</option>)}</select></label><button className="action">New game</button>
      </form>}</aside>
    </div>}</main>;
}
