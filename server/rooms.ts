import { meter, accepts, challenge, type Spend } from "./guard";
export { spendSql } from "./guard";
import { avatarSets, validAvatar } from "../src/avatars";
import {applyMove, newMatch, seats} from "../src/match";
import type { Match, Standing } from "../src/match";

type Room = {wins?: Record<number,number>; former?: Standing[]; departedWinner?: Standing; host?:number;round?:number; ready?:number[]; names?:Record<number,string>; avatars?: Record<number,string>; game: Match; players: Record<string,string>; invite: string; version: number};
export interface Store {
  spend: Spend;
  read(id:string): Promise<Room | null>;
  save(id:string, room:Room, previous:number | null): Promise<boolean>;
}
const json = (body:unknown, status=200) => Response.json(body,{status,headers:{"Cache-Control":"no-store"}});
const fail = (message:string,status:number) => json({error:message},status);
const valid = (v: unknown): v is string => typeof v === "string" && /^[a-f0-9]{32}$/.test(v);
async function digest(token:string) {
  const hash = await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token));
  return Array.from(new Uint8Array(hash), b=>b.toString(16).padStart(2,"0")).join("");
}
function claimed(room:Room) {
  return Object.keys(room.players).map(Number).map(t=>room.avatars?.[t] || avatarSets.Emotions[t][0]);
}
function standing(room:Room, seat:number):Standing {
  return {name:room.names?.[seat] || avatarSets.Emotions[seat][1], avatar:room.avatars?.[seat] || avatarSets.Emotions[seat][0], wins:room.wins?.[seat] ?? 0};
}
function view(room:Room, seat:number) {
  const leaderboard=[...Object.keys(room.players).map(s=>standing(room,Number(s))), ...(room.former ?? [])].sort((a,b)=>b.wins-a.wins);
  return json({leaderboard,departedWinner:room.departedWinner,round:room.round ?? 1,ready:room.ready ?? [],names:room.names ?? {},avatars:room.avatars ?? {}, game:room.game, joined:Object.keys(room.players).map(Number), seat, version:room.version,
    ...(seat === (room.host ?? room.game.teams[0]) ? {invite:room.invite} : {})});
}
export async function roomApi(req:Request, store:Store, accessCode?:string):Promise<Response> {
  if (!accessCode || req.headers.get("X-Family-Code") !== accessCode)
    return fail("Enter a valid multiplayer access code.",401);
  const id = new URL(req.url).pathname.split("/").pop();
  if (id==="unlock" && req.method==="POST") return json({unlocked:true});
  if (!valid(id)) return fail("Room not found.",404);
  const token = req.headers.get("Authorization")?.replace(/^Bearer /,"");
  if (!valid(token)) return fail("Open your family invitation to join.",403);
  const key = await digest(token);
  if (req.method!=="POST" && req.method!=="GET") return fail("Method unavailable.",405);
  const body=req.method==="POST" ? await req.json().catch(()=>null) : {};
  if (!body || typeof body!=="object") return fail("Invalid request.",400);
  const admission=["challenge","create","join"].includes(body.action);
  const secret=await meter(store.spend,admission);
  if (secret instanceof Response) return secret;
  if (body.action==="challenge") {
    if (body.for!=="create" && body.for!=="join") return fail("Invalid challenge.",400);
    return json(await challenge(secret,id,key,body.for));
  }
  const room = await store.read(id);
  const seat = room ? Number(Object.keys(room.players).find(s=>room.players[s]===key)) : NaN;
  if(req.method==="GET") return room && Number.isInteger(seat) ? view(room,seat) : fail("Room or seat unavailable.",403);
  if (body.action==="availability") {
    if (!room || !valid(body.invite) || room.invite!==body.invite) return fail("Open the full invite link from the host.",403);
    return json({claimed:claimed(room)});
  }
  if (admission && !Number.isInteger(seat) && !await accepts(body.proof,secret,id,key,body.action))
    return fail("Browser check expired or failed. Please try again.",403);
  if ((body.action==="create" || body.action==="join") && body.avatar !== undefined && !validAvatar(body.avatar)) {
    return fail("Choose an emoji from the available sets.",400);
  }
  const name=typeof body.name==="string" ? body.name.trim() : "";
  if ((body.action==="create" || body.action==="join") && (name.length>32 || Array.from(name).some(c=>c.charCodeAt(0)<32))) return fail("Use a single-line name of up to 32 characters.",400);
  if (body.action==="create") {
    if (room) return Number.isInteger(seat) ? view(room,seat) : fail("Room already exists.",409);
    if (![2,3,4,6].includes(body.count) || typeof body.long!=="boolean") return fail("Choose a supported player count.",400);
    if (!name) return fail("Enter your name to create a room.",400);
    const team = seats[body.count][0];
    const created = {names:{[team]:name},avatars:body.avatar ? {[team]:body.avatar} : {},game:newMatch(body.count,body.long),players:{[team]:key},invite:crypto.randomUUID().replaceAll("-",""),version:1};
    return await store.save(id,created,null) ? view(created,team) : fail("Try creating the room again.",409);
  }
  if (!room) return fail("Room not found.",404);
  if (body.action==="join") {
    if (Number.isInteger(seat)) return view(room,seat);
    if (!valid(body.invite) || body.invite!==room.invite) return fail("This invitation is invalid.",403);
    const free = room.game.teams.find(t=>!room.players[t]);
    if (free===undefined) return fail("All seats are taken.",409);
    if (!name) return fail("Enter your name to join the room.",400);
    const used=claimed(room);
    if(body.avatar && used.includes(body.avatar)) return fail("Someone already picked that emoji. Choose another.",409);
    const preferred=avatarSets.Emotions[free][0];
    const symbol=body.avatar || (!used.includes(preferred) ? preferred : Object.values(avatarSets).flat().find(([option])=>!used.includes(option))![0]);
    const joined={...room,names:{...room.names,[free]:name},avatars:{...room.avatars,[free]:symbol},players:{...room.players,[free]:key},version:room.version+1};
    return await store.save(id,joined,room.version) ? view(joined,free) : fail("Another player just joined. Try again.",409);
  }
  if (!Number.isInteger(seat)) return fail("This seat is private.",403);
  if(body.action==="quit"){
    const updated=structuredClone(room);
    const leaving=standing(room,seat);
    delete updated.players[seat];
    delete updated.names?.[seat];
    delete updated.avatars?.[seat];
    delete updated.wins?.[seat];
    if(leaving.wins) updated.former=[...(room.former ?? []),leaving];
    if(room.game.winner && room.game.teams[room.game.turn]===seat && !room.departedWinner) updated.departedWinner=leaving;
    if(room.game.undo && room.game.teams[room.game.undo.turn]===seat) updated.game.undo=null;
    updated.ready=room.ready?.filter(s=>s!==seat);
    if(seat===(room.host ?? room.game.teams[0])) updated.host=room.game.teams.find(s=>updated.players[s]);
    if(!Object.keys(updated.players).length) updated.invite="";
    updated.version++;
    return await store.save(id,updated,room.version) ? json({left:true}) : fail("The room changed. Try quitting again.",409);
  }
  if(body.action==="rename"){
    if(!name || name.length>32 || Array.from(name).some(c=>c.charCodeAt(0)<32)) return fail("Enter a name of up to 32 characters.",400);
    const updated={...room,names:{...room.names,[seat]:name},version:room.version+1};
    return await store.save(id,updated,room.version) ? view(updated,seat) : fail("The room changed. Please save again.",409);
  }
  if (body.action==="rematch") {
    let current:Room | null=room;
    for(let attempt=0;current && attempt<=room.game.teams.length;attempt++){
      if(current.players[seat]!==key) return fail("This seat is private.",403);
      const round=current.round ?? 1;
      if(body.round!==round || current.ready?.includes(seat)) return view(current,seat);
      if(!current.game.winner) return fail("Finish this round before starting another.",409);
      const ready=[...(current.ready ?? []),seat];
      const complete=ready.length===current.game.teams.length;
      const updated={...current,ready:complete ? [] : ready,round:complete ? round+1 : round,
        departedWinner:complete ? undefined : current.departedWinner,game:complete ? newMatch(ready.length,current.game.long) : current.game,version:current.version+1};
      if(await store.save(id,updated,current.version)) return view(updated,seat);
      current=await store.read(id);
    }
    return fail("Please try the rematch again.",409);
  }
  if (body.version!==room.version) return fail("The board changed. Check the latest position.",409);
  const move=body.move;
  if (body.action!=="move" || !move || typeof move!=="object") return fail("Invalid move.",400);
  if ("undo" in move) {
    const previous=room.game.undo;
    if (move.undo!==true || !previous || seat!==room.game.teams[previous.turn]) return fail("Only the last mover can undo.",409);
  } else {
    if (Object.keys(room.players).length!==room.game.teams.length || seat!==room.game.teams[room.game.turn]) return fail("Wait for your turn.",409);
    if (!(move.end===true || (typeof move.from==="string" && typeof move.to==="string" && !("end" in move)))) return fail("Invalid move.",400);
  }
  const game=applyMove(room.game,move);
  if (!game) return fail("That move is unavailable.",422);
  const updated={...room,game,version:room.version+1};
  if(game.winner) updated.wins={...room.wins,[seat]:(room.wins?.[seat] ?? 0)+1};
  return await store.save(id,updated,room.version) ? view(updated,seat) : fail("The board changed. Check the latest position.",409);
}
