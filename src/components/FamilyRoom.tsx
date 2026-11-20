import { solveChallenge } from "altcha-lib";
import type { Challenge } from "altcha-lib/types";
import { avatarSets, avatarColors } from "../avatars";
import { useCallback, useEffect, useRef, useState } from "react";
import Board, { MoodFace } from "./Board";
import type { Move, RoomView } from "../match";

const roomApiBase=(import.meta.env.VITE_ROOM_API_ORIGIN || "")+"/api/rooms/";
const codeKey="emotion-checkers-family-access";
const fresh = () => crypto.randomUUID().replace(/-/g,"");
const names = ["Joy","Fear","Anger","Sadness","Disgust","Calm"];
class RoomError extends Error {
  constructor(message:string, readonly status:number, readonly monthly:boolean, readonly retryMs:number) { super(message); }
}
function locationRoom() {
  const params = new URLSearchParams(location.hash.slice(1));
  return {id:params.get("room") || "", invite:params.get("invite") || ""};
}
export default function FamilyRoom() {
  const [{id,invite},setLocation] = useState(locationRoom);
  const [room,setRoom] = useState<RoomView | null>(null);
  const [code,setCode]=useState(()=>sessionStorage.getItem(codeKey) || "");
  const [enteredCode,setEnteredCode]=useState("");
  const [name,setName] = useState("");
  const [avatar,setAvatar] = useState("");
  const [taken,setTaken]=useState<string[] | null>(null);
  const [refresh,setRefresh]=useState(0);
  const [editing,setEditing]=useState(false);
  const [count,setCount] = useState(2);
  const [long,setLong] = useState(true);
  const [error,setError] = useState("");
  const [busy,setBusy] = useState(false);
  const nameInput=useRef<HTMLInputElement>(null);
  const lock = useRef(false);
  const active = useRef(id);
  const [copied,setCopied] = useState(false);
  useEffect(()=>{
    const change=()=>{const loc=locationRoom();active.current=loc.id;setLocation(loc);setRoom(null);setName("");setAvatar("");setTaken(null);setEditing(false);setError("");setCopied(false)};
    window.addEventListener("hashchange",change);
    return ()=>window.removeEventListener("hashchange",change);
  },[]);
  const request=useCallback(async <T=RoomView,>(target:string, body?:object) => {
    const storageKey="emotion-seat-"+target;
    const pending=!!invite && target===id;
    const key=pending ? "joining-"+storageKey : storageKey;
    let token=sessionStorage.getItem(key) || (!pending && localStorage.getItem(storageKey));
    if (!token && body) {
      token=fresh();
      sessionStorage.setItem(key,token);
      if(!pending) localStorage.setItem(storageKey,token);
    }
    if (!token) throw Error("Use the invitation link to take your seat.");
    const response=await fetch(roomApiBase+target,{method:body?"POST":"GET",cache:"no-store",headers:{"X-Family-Code":code,Authorization:"Bearer "+token,"Content-Type":"application/json"},body:body?JSON.stringify(body):undefined});
    const value=await response.json().catch(()=>{throw Error("The room server is unavailable.")});
    if (response.status===401){sessionStorage.removeItem(codeKey);setCode("");setRoom(null);setError(value.error);}
    if (!response.ok) throw new RoomError(value.error || "Could not reach the room.",response.status,!!value.monthly,Number(response.headers.get("Retry-After"))*1000);
    return value as T;
  },[id,invite,code]);
  function update(next:RoomView) {setRoom(old=>!old || next.version>old.version ? next : old)}
  useEffect(()=>{
    if(!code || !id || !invite) return;
    let cancelled=false;
    let timer:ReturnType<typeof setTimeout>;
    async function refreshChoices(){
      if(cancelled) return;
      let delay=12000;
      if(!document.hidden){
        try {
          const data=await request<{claimed:string[]}>(id,{action:"availability",invite});
          if(!cancelled){setTaken(data.claimed);setAvatar(old=>data.claimed.includes(old)?"":old);}
        }catch(e){
          if(!cancelled)setError((e as Error).message);
          if(e instanceof RoomError && (e.monthly || e.status===403)) return;
          if(e instanceof RoomError) delay=Math.max(delay,e.retryMs);
        }
      }
      if(!cancelled) timer=setTimeout(refreshChoices,delay);
    }
    void refreshChoices();
    return ()=>{cancelled=true;clearTimeout(timer)};
  },[id,invite,code,refresh,request]);
  const readyForRematch=!!room?.ready?.includes(room.seat);
  useEffect(()=>{
    if (!code || !id || invite || !(sessionStorage.getItem("emotion-seat-"+id) || localStorage.getItem("emotion-seat-"+id))) return;
    let cancelled=false;
    let running=false;
    let stopped=false;
    let earliest=0;
    let timer:ReturnType<typeof setTimeout>;
    async function poll(){
      clearTimeout(timer);
      if(cancelled || running || stopped || document.hidden) return;
      if(Date.now()<earliest){timer=setTimeout(poll,earliest-Date.now());return;}
      running=true;
      let delay=5000;
      try {
        const value=await request(id);
        if(!cancelled){update(value);setError("");stopped=value.game.winner && !value.ready?.includes(value.seat);}
      } catch(e){
        if(!cancelled) setError((e as Error).message);
        if(e instanceof RoomError){stopped=e.monthly || e.status===403 || e.status===404;delay=Math.max(delay,e.retryMs);}
        else delay=15000;
      } finally {running=false;}
      earliest=Date.now()+delay;
      if(!cancelled && !stopped && !document.hidden) timer=setTimeout(poll,delay);
    }
    void poll();
    document.addEventListener("visibilitychange",poll);
    return ()=>{cancelled=true;clearTimeout(timer);document.removeEventListener("visibilitychange",poll)};
  },[id,invite,code,readyForRematch,request]);
  async function send(action:"create"|"join"|"move"|"rematch"|"rename"|"quit",move?:Move) {
    if(lock.current) return;
    if((action==="create" || action==="join" || action==="rename") && !name.trim()){
      setError("Please enter your name to play.");
      nameInput.current?.focus();
      return;
    }
    lock.current=true;setBusy(true);setError("");
    const previous=active.current;
    const target=action==="create"?fresh():id;
    try {
      if(action==="quit"){
        const key="emotion-seat-"+id;
        const token=sessionStorage.getItem(key) || localStorage.getItem(key);
        await request(target,{action});
        if(localStorage.getItem(key)===token) localStorage.removeItem(key);
        sessionStorage.removeItem(key);
        if(active.current===previous){active.current="";location.hash="";}
        return;
      }
      let proof;
      if(action==="create" || action==="join"){
        const check=await request<Challenge>(target,{action:"challenge",for:action});
        const {promise}=solveChallenge(check.challenge,check.salt,check.algorithm,check.maxnumber);
        const solution=await promise;
        if(!solution) throw Error("Browser check failed. Please try again.");
        proof={...check,number:solution.number};
      }
      const value=await request(target,{action,round:room?.round ?? 1,proof,count,long,invite,move,name:name.trim(),avatar:avatar || undefined,version:room?.version});
      if(active.current!==previous)return;
      if(action==="create" || action==="join"){
        if(action==="join"){
          const key="emotion-seat-"+target;
          const token=sessionStorage.getItem("joining-"+key);
          if(token){
            sessionStorage.setItem(key,token);
            if(!localStorage.getItem(key)) localStorage.setItem(key,token);
            sessionStorage.removeItem("joining-"+key);
          }
        }
        history.replaceState(null,"","#room="+target);
        active.current=target;setLocation({id:target,invite:""});
      }
      update(value);
      setEditing(false);
    } catch(e){if(active.current===previous){setError((e as Error).message);if(action==="join")setRefresh(n=>n+1);}}
    finally{lock.current=false;setBusy(false)}
  }
  const picker=<><label>Your name (required) <input required ref={nameInput} autoComplete="nickname" maxLength={32} value={name} placeholder="Display name" onChange={e=>setName(e.target.value)}/></label><label>Your emoji <select disabled={!!invite && taken===null} value={avatar} onChange={e=>setAvatar(e.target.value)}>
    <option value="">Choose for me</option>
    {Object.entries(avatarSets).map(([group,choices])=><optgroup key={group} label={group}>
      {choices.filter(([symbol])=>!invite || !taken?.includes(symbol)).map(([symbol,name])=><option key={symbol} value={symbol}>{symbol} {name}</option>)}
    </optgroup>)}
  </select>{avatar && <span aria-hidden="true" style={{backgroundColor:avatarColors[avatar],borderRadius:"50%",padding:"0.2em",lineHeight:1}}><MoodFace symbol={avatar}/></span>}</label></>;
  const link=room?.invite ? location.origin+location.pathname+"#room="+id+"&invite="+room.invite : "";
  const guestForm=<section className="family guest-entry"><h2>Join family game</h2>
    <form onSubmit={e=>{e.preventDefault();void send("join")}}>{picker}<button className="action" disabled={busy}>Join family game</button></form>
    {busy && <p role="status">Checking your browser…</p>}{error && <p role="alert">{error}</p>}
  </section>;
  async function unlock(event:React.FormEvent){
    event.preventDefault();
    if(lock.current) return;
    lock.current=true;setBusy(true);setError("");
    const candidate=enteredCode.trim();
    try {
      const response=await fetch(roomApiBase+"unlock",{method:"POST",headers:{"X-Family-Code":candidate},cache:"no-store"});
      if(!response.ok) throw Error(response.status===401 ? "That access code didn’t match. Try again." : "Could not unlock multiplayer. Try again.");
      const result=await response.json();
      if(result.unlocked!==true) throw Error("The room server is unavailable.");
      sessionStorage.setItem(codeKey,candidate);setCode(candidate);setEnteredCode("");
    }catch(e){setError((e as Error).message)}
    finally{lock.current=false;setBusy(false)}
  }
  const panel=!code ? <details className="family" open={id ? true : undefined}>
    <summary>Private multiplayer</summary>
    <form className="room-controls" onSubmit={unlock}><label>Multiplayer access code <input type="password" required autoComplete="off" value={enteredCode} onChange={e=>setEnteredCode(e.target.value)}/></label>
    <button className="action" disabled={busy}>Unlock multiplayer</button></form>
    {error && <p role="alert">{error}</p>}</details> : id && invite && !room ? guestForm : <details className="family" open={id ? true : undefined}><summary>{id?"Family room":"Play online with family"}</summary>
    {!id ? <div className="room-controls">{picker}<label>Family players <select value={count} onChange={e=>setCount(Number(e.target.value))}>{[2,3,4,6].map(n=><option key={n}>{n}</option>)}</select></label>
    <label><input type="checkbox" checked={long} onChange={e=>setLong(e.target.checked)}/> Allow chain jumps</label><button className="action" disabled={busy} onClick={()=>void send("create")}>Create private room</button></div> :
    <div className="room-controls">{room ? <><span>You play {room.names?.[room.seat] || names[room.seat]} · {room.joined.length}/{room.game.teams.length} seated</span>
    {editing ? <form onSubmit={e=>{e.preventDefault();void send("rename")}}><label>Your name <input required ref={nameInput} value={name} maxLength={32} onChange={e=>setName(e.target.value)}/></label><button className="action" disabled={busy}>Save name</button></form> :
      <button className="action" onClick={()=>{setName(room.names?.[room.seat] || "");setEditing(true);}}>Edit my name</button>}
    {link && room.joined.length<room.game.teams.length && <><label>Family invite <input aria-label="Family invite link" readOnly value={link} onFocus={e=>e.target.select()}/></label>
    <button className="action" onClick={async()=>{try{await navigator.clipboard.writeText(link);setCopied(true)}catch{setError("Select the invite link and copy it.")}}}>{copied?"Copied":"Copy invite"}</button></>}</> :
    <span>{localStorage.getItem("emotion-seat-"+id) ? "Reconnecting to your seat…" : "Ask the host for the link from Copy invite to enter your name and join."}</span>}
    <a href="#">Same-device game</a></div>}
    {busy && !room && <p role="status">Checking your browser…</p>}
    {error && <p role="status">{error}</p>}</details>;
  return <Board key={id || "local"} panel={panel} onQuit={()=>{if(!room){location.hash="";return;} if(window.confirm("Quit this game and free your seat? The other players can invite someone to take your place.")) void send("quit");}} room={room} online={!!id} busy={busy} onRematch={()=>void send("rematch")} onMove={move=>void send("move",move)}/>;
}
