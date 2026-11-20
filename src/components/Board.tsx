import {useJumpSound} from "./useJumpSound";
import BoardView from "./BoardView";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { rows, moves } from "../rules";
import { newMatch, applyMove, seats, type Move, type RoomView } from "../match";

const moods = [
  ["Joy", "😄", "#ffc548"], ["Fear", "😨", "#af88ff"], ["Anger", "😡", "#ff705e"],
  ["Sadness", "😢", "#60acff"], ["Disgust", "🤢", "#9ad981"], ["Calm", "😌", "#69dcd2"],
];
const tint = (camp: number) => ({"--tint": moods[camp]?.[2] ?? "#847697"} as CSSProperties);

function MoodFace({symbol,smiling=false}:{symbol:string;smiling?:boolean}) {
  if (smiling && symbol==="😢") return <span className="sad-face sad-smiling" role="img" aria-label="Sadness smiling"><i/></span>;
  if (smiling) {
    const mood=moods.find(([,face])=>face===symbol);
    const style=mood ? tint(moods.indexOf(mood)) : undefined;
    const smile=<span className="smile-face" style={style} role="img" aria-label={mood ? mood[0]+" smiling" : "Smiling"}><i/></span>;
    if (symbol==="😄") return <>{symbol}</>;
    return mood ? smile : <span className="smiling-avatar">{symbol}{smile}</span>;
  }
  if (symbol === "😢") return <span className="sad-face" role="img" aria-label="Sadness"><i /></span>;
  if (symbol === "😨" || symbol === "😌") return <span className={symbol === "😨" ? "fear-face" : "calm-face"}>{symbol}</span>;
  return <>{symbol}</>;
}

type Props = {onQuit?:()=>void;onRematch?:()=>void; panel?: ReactNode; room?: RoomView | null; online?: boolean; busy?: boolean; onMove?: (move: Move) => void};
export default function Board({panel, room, online, busy, onMove, onRematch, onQuit}: Props) {
  const [local, setLocal] = useState(() => newMatch(6, true));
  const game = room?.game ?? local;
  const {teams, board, turn, path, long, winner} = game;
  const {enabled:sounds,toggle:toggleSounds,play:playSound}=useJumpSound();
  const landing=game.undo?.to;
  const previousBoard = useRef(board);
  const boardElement = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const previous = previousBoard.current;
    previousBoard.current = board;
    if (previous === board) return;
    const departed = Object.keys(previous).filter(id => previous[id] !== undefined && board[id] === undefined);
    const arrived = Object.keys(board).filter(id => previous[id] === undefined && board[id] !== undefined);
    if (departed.length !== 1 || arrived.length !== 1) return;
    const [from] = departed;
    const [to] = arrived;
    if (previous[from] !== board[to]) return;
    if (landing===to && moves(previous,from,true).has(to)) playSound();
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const hole = (id: string) => boardElement.current?.querySelector<HTMLButtonElement>(`[data-hole="${id}"]`);
    const start = hole(from);
    const end = hole(to);
    if (!start || !end) return;
    const x = start.offsetLeft - end.offsetLeft;
    const y = start.offsetTop - end.offsetTop;
    end.querySelector(".marble")?.animate?.([
      {translate: x + "px " + y + "px"},
      {translate: "0px 0px"}
    ], {duration: 240, easing: "ease-out"});
  }, [board,landing,playSound]);
  const playerName = (t:number) => room?.names?.[t] || moods[t][0];
  const avatar = (team: number) => room?.avatars?.[team] || moods[team][1];
  const [choice, select] = useState("");
  const waiting = online && (!room || room.joined.length < teams.length);
  const mine = !online || (!waiting && room?.seat === teams[turn]);
  const selected = mine ? game.chain || choice : "";
  const [faces, setFaces] = useState(true);
  const [reactions, setReactions] = useState(true);
  const [hints, setHints] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [reaction, setReaction] = useState<string | null>(null);
  useEffect(() => {
    if (!reaction) return;
    const timer = window.setTimeout(() => setReaction(null), 950);
    return () => window.clearTimeout(timer);
  }, [reaction]);
  useEffect(() => {
    select("");
    if (game.last && faces && reactions) {
      setReaction(game.last);
    }
    // React to a completed move once, including moves made by another player.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game]);
  const team = teams[turn];
  const legal = moves(board, selected, !!game.chain);
  for (const seen of path) legal.delete(seen);
  function act(move: Move) {
    if (busy || winner || (!("undo" in move) && (rotating || !mine))) return;
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
  const undoButton=<button className="action move-control" disabled={busy || winner || !game.undo || (online && room?.seat !== teams[game.undo.turn])} onClick={() => act({undo:true})}>Undo move</button>;
  const endButton=<button className="action move-control" disabled={!mine || !path.length || rotating || busy || winner} onClick={() => act({end:true})}>End turn</button>;
  const winnerName=room?.departedWinner?.name || playerName(team);
  return <main>
    <header className={online ? "multiplayer-header" : undefined}><span className="brand-mark" aria-hidden="true">✦</span><h1>Emotion Checkers</h1>{online && <button className="action quit" disabled={busy} onClick={onQuit}>Quit game</button>}<details className="help"><summary>How to play</summary><div>Race your ten marbles to the opposite point of the star. Step to an empty neighbor or hop over one marble of any color. With chain jumps on, keep hopping with that marble or choose End turn. Each hop crosses one adjacent marble into the empty hole immediately beyond. Pieces stay on the board. Once in your goal, stay inside it. Undo move returns your marble to where it started this turn.</div></details></header>
    {panel}
    {(!online || room) && <div className="table" ref={boardElement}>
      <BoardView rotating={rotating} controls={<div className="mobile-turn-actions">{undoButton}{endButton}</div>}>
        {rows.map((row, r) => <div className="row" key={r}>{row.map((c, i) => {
          const piece = board[c.id];
          const own = piece === team && (!path.length || selected === c.id);
          const label = piece !== undefined ? playerName(piece) : (hints && legal.get(c.id)) || "Empty";
          return <button data-hole={c.id} key={c.id} style={tint(c.camp)} className={'hole' + (hints && legal.has(c.id) ? ' legal' : '') + (selected === c.id ? ' selected' : '')}
            disabled={!mine || busy || winner || rotating || (!own && !legal.has(c.id))} aria-label={label + ', row ' + (r+1) + ', hole ' + (i+1)}
            aria-pressed={piece === undefined ? undefined : selected === c.id} onClick={() => play(c.id)}>
            {piece !== undefined && <span className="marble" style={tint(piece)}>{faces && <span className="upright"><span className={reactions && reaction === c.id ? "face reacting" : "face"}><MoodFace symbol={avatar(piece)} smiling={reactions && (winner ? piece===team : game.smile && reaction===c.id && game.last===c.id)}/></span></span>}</span>}</button>;
        })}</div>)}
      </BoardView>
      <aside><div className="turn" aria-live="polite"><p className="eyebrow">{winner ? "Winner" : "At the table"}</p>
      <h2 style={tint(team)}><MoodFace symbol={room?.departedWinner?.avatar || avatar(team)} smiling={winner && faces && reactions}/> {winner ? (!room?.departedWinner && (!online || room?.seat===team) ? "You won!" : winnerName+" wins!") : playerName(team)+"’s turn"}</h2>
      {winner && <div className="confetti" aria-hidden="true">{Array.from({length:22},(_,i)=><i key={i} style={{left:(i*47%100)+"%",background:moods[i%6][2],animationDelay:(i%5)*0.09+"s"}}/>)}</div>}
      <p>{winner ? winnerName+" brought all ten marbles home." : waiting ? "Share the invitation. Play starts when everyone is seated." : !mine ? "Waiting for " + playerName(team) + " to move." : rotating ? "Drag around the board’s center. Switch off drag and turn to play." : path.length ? "Hop again with this marble, or end your turn." : selected ? legal.size ? (hints ? "Choose a glowing spot to land." : "Choose your landing spot.") : "This marble is blocked. Pick another." : (hints ? "Pick a marble to see where it can go." : "Pick a marble, then choose your move.")}</p></div>
      <div className="turn-actions">
      {mine && path.length > 0 && endButton}
      {undoButton}
      {winner && <button className="action" disabled={busy || !!room?.ready?.includes(room.seat)} onClick={()=>online ? onRematch?.() : setLocal(newMatch(teams.length,long))}>{room?.ready?.includes(room.seat) ? "Ready for rematch" : "Play again"}</button>}
      </div>
      {winner && online && !!room?.ready?.length && <p role="status">{room.ready.length}/{teams.length} ready to play again</p>}
      {online && !winner && game.undo && !mine && room?.seat===teams[game.undo.turn] && <small>You can undo until the next player moves.</small>}
      <div className="teams">{teams.map(t => <div key={t}><i style={tint(t)} />{online && <MoodFace symbol={avatar(t)}/>} {playerName(t)}<small>{rows.flat().filter(c => c.camp === (t+3)%6 && board[c.id] === t).length}/10</small></div>)}</div>
      {room?.leaderboard && <section className="leaderboard"><h3>Room leaderboard</h3><table><thead><tr><th>Player</th><th>Wins</th></tr></thead><tbody>{room.leaderboard.map((row,i)=><tr key={i}><td><MoodFace symbol={row.avatar}/> {row.name}</td><td>{row.wins}</td></tr>)}</tbody></table></section>}
      <label className="setting"><input type="checkbox" checked={long} disabled={online || !!path.length} onChange={e => setLocal({...local,long:e.target.checked,last:""})}/> Allow chain jumps</label>
      <label className="setting"><input type="checkbox" checked={sounds} onChange={e=>toggleSounds(e.target.checked)}/> Jump sounds</label>
      <label className="setting"><input type="checkbox" checked={faces} onChange={e => {setFaces(e.target.checked); setReaction(null);}}/> Emoji marbles</label>
      <label className="setting"><input type="checkbox" checked={faces && reactions} disabled={!faces} onChange={e => {setReactions(e.target.checked); setReaction(null);}}/> Turn-end reactions</label>
      <label className="setting"><input type="checkbox" checked={hints} onChange={e => setHints(e.target.checked)}/> Show possible moves</label>
      <label className="setting"><input type="checkbox" checked={rotating} onChange={e => setRotating(e.target.checked)}/> Drag and turn board</label>
      {!online && <form onSubmit={e => {e.preventDefault(); setLocal(newMatch(Number(new FormData(e.currentTarget).get("players")),long)); setReaction(null);}}>
        <label>Players <select name="players" defaultValue="6">{Object.keys(seats).map(n => <option key={n}>{n}</option>)}</select></label><button className="action">New game</button>
      </form>}</aside>
    </div>}</main>;
}
