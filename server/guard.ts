import type { Payload } from "altcha-lib/types";
import { createChallenge, extractParams, verifySolution } from "altcha-lib";

export const monthLimit = 100_000;
const difficulty = 35_000;
// The same atomic statement runs on SQLite and D1. A fixed bucket key keeps
// storage bounded; its counter rolls over on the first request of a new period.
export const spendSql = `INSERT INTO room_meter (bucket,period,used) VALUES (?, ?, 1)
ON CONFLICT(bucket) DO UPDATE SET period=excluded.period,
used=CASE WHEN room_meter.period=excluded.period THEN room_meter.used+1 ELSE 1 END
WHERE room_meter.period<excluded.period OR (room_meter.period=excluded.period AND room_meter.used<?)
RETURNING secret`;
export type Spend = (bucket:string, period:string, limit:number)=>Promise<{secret:string} | null>;

export function paused(monthly:boolean, now:Date) {
  const reset=monthly ? Date.UTC(now.getUTCFullYear(),now.getUTCMonth()+1,1) : (Math.floor(now.getTime()/60000)+1)*60000;
  return Response.json({error:monthly ? "Monthly multiplayer limit reached. Online play resumes "+new Date(reset).toISOString().slice(0,10)+" UTC. Same-device play is available." : "Too many requests. Please try again in a minute.", monthly},
    {status:429,headers:{"Cache-Control":"no-store","Retry-After":String(Math.ceil((reset-now.getTime())/1000))}});
}

export async function meter(spend:Spend, admission:boolean, now=new Date()) {
  const stamp=now.toISOString();
  const burst=await spend(admission ? "admissions" : "game",stamp.slice(0,16),admission ? 36 : 180);
  if (!burst) return paused(false,now);
  const month=await spend("monthly",stamp.slice(0,7),monthLimit);
  return month?.secret ?? paused(true,now);
}

export function challenge(secret:string, room:string, seat:string, action:string) {
  return createChallenge({algorithm:"SHA-256",maxnumber:difficulty,hmacKey:secret,
    expires:new Date(Date.now()+180000),params:{room,seat,action}});
}
export async function accepts(proof:Partial<Payload> | null | undefined, secret:string, room:string, seat:string, action:string) {
  if (!proof || proof.algorithm!=="SHA-256" || typeof proof.challenge!=="string" || typeof proof.signature!=="string" || typeof proof.salt!=="string" || proof.salt.length>400 ||
      !Number.isInteger(proof.number) || Number(proof.number)<0 || Number(proof.number)>difficulty) return false;
  const data=proof as Payload;
  const p=extractParams(data);
  return p.room===room && p.seat===seat && p.action===action && !!p.expires && await verifySolution(data,secret);
}
