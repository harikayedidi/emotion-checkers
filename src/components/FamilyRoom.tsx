import { avatarSets } from "../avatars";
import { useEffect, useRef, useState } from "react";
import Board from "./Board";
import type { Move, RoomView } from "../match";

const fresh = () => crypto.randomUUID().replace(/-/g,"");
const names = ["Joy","Fear","Anger","Sadness","Disgust","Calm"];
function locationRoom() {
  const params = new URLSearchParams(location.hash.slice(1));
  return {id:params.get("room") || "", invite:params.get("invite") || ""};
}
export default function FamilyRoom() {
  const [{id,invite},setLocation] = useState(locationRoom);
  const [room,setRoom] = useState<RoomView | null>(null);
  const [avatar,setAvatar] = useState("");
  const [count,setCount] = useState(2);
  const [long,setLong] = useState(false);
  const [error,setError] = useState("");
  const [busy,setBusy] = useState(false);
  const lock = useRef(false);
  const active = useRef(id);
  const [copied,setCopied] = useState(false);
  useEffect(()=>{
    const change=()=>{const loc=locationRoom();active.current=loc.id;setLocation(loc);setRoom(null);setError("");setCopied(false)};
    window.addEventListener("hashchange",change);
    return ()=>window.removeEventListener("hashchange",change);
  },[]);
  async function request(target:string, body?:object) {
    const storageKey="emotion-seat-"+target;
    let token=localStorage.getItem(storageKey);
    if (!token && body) { token=fresh(); localStorage.setItem(storageKey,token); }
    if (!token) throw Error("Use the invitation link to take your seat.");
    const response=await fetch("/api/rooms/"+target,{method:body?"POST":"GET",cache:"no-store",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:body?JSON.stringify(body):undefined});
    const value=await response.json().catch(()=>{throw Error("The room server is unavailable.")});
    if (!response.ok) throw Error(value.error || "Could not reach the room.");
    return value as RoomView;
  }
  function update(next:RoomView) {setRoom(old=>!old || next.version>old.version ? next : old)}
  useEffect(()=>{
    if (!id || !localStorage.getItem("emotion-seat-"+id)) return;
    let cancelled=false;
    let timer:ReturnType<typeof setTimeout>;
    async function poll(){
      try{const value=await request(id);if (!cancelled) {update(value);setError("")}}
      catch(e){if(!cancelled) setError((e as Error).message)}
      if(!cancelled) timer=setTimeout(poll,1500);
    }
    void poll();
    return ()=>{cancelled=true;clearTimeout(timer)};
  },[id,invite]);
  async function send(action:"create"|"join"|"move",move?:Move) {
    if(lock.current) return;
    lock.current=true;setBusy(true);setError("");
    const previous=active.current;
    const target=action==="create"?fresh():id;
    try {
      const value=await request(target,{action,count,long,invite,move,avatar:avatar || undefined,version:room?.version});
      if(active.current!==previous)return;
      if(action!=="move"){
        history.replaceState(null,"","#room="+target);
        active.current=target;setLocation({id:target,invite:""});
      }
      update(value);
    } catch(e){if(active.current===previous)setError((e as Error).message)}
    finally{lock.current=false;setBusy(false)}
  }
  const picker=<label>Your emoji <select value={avatar} onChange={e=>setAvatar(e.target.value)}>
    <option value="">Team emotion</option>
    {Object.entries(avatarSets).map(([group,choices])=><optgroup key={group} label={group}>
      {choices.map(([symbol,name])=><option key={symbol} value={symbol}>{symbol} {name}</option>)}
    </optgroup>)}
  </select></label>;
  const link=room?.invite ? location.origin+location.pathname+"#room="+id+"&invite="+room.invite : "";
  const panel=<details className="family" open={id ? true : undefined}><summary>{id?"Family room":"Play online with family"}</summary>
    {!id ? <div className="room-controls">{picker}<label>Family players <select value={count} onChange={e=>setCount(Number(e.target.value))}>{[2,3,4,6].map(n=><option key={n}>{n}</option>)}</select></label>
    <label><input type="checkbox" checked={long} onChange={e=>setLong(e.target.checked)}/> Long jumps</label><button className="action" disabled={busy} onClick={()=>void send("create")}>Create private room</button></div> :
    <div className="room-controls">{room ? <><span>You play {names[room.seat]} · {room.joined.length}/{room.game.teams.length} seated</span>
    {link && room.joined.length<room.game.teams.length && <><label>Family invite <input aria-label="Family invite link" readOnly value={link} onFocus={e=>e.target.select()}/></label>
    <button className="action" onClick={async()=>{try{await navigator.clipboard.writeText(link);setCopied(true)}catch{setError("Select the invite link and copy it.")}}}>{copied?"Copied":"Copy invite"}</button></>}</> :
    invite ? <>{picker}<button className="action" disabled={busy} onClick={()=>void send("join")}>Join family game</button></> : <span>Reconnecting to your seat…</span>}
    <a href="#">Same-device game</a></div>}
    {error && <p role="status">{error}</p>}</details>;
  return <Board key={id || "local"} panel={panel} room={room} online={!!id} busy={busy} onMove={move=>void send("move",move)}/>;
}
