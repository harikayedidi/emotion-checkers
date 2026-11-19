import assert from 'node:assert/strict';
import { test } from 'node:test';
import { solveChallenge } from 'altcha-lib';
import { DatabaseSync } from 'node:sqlite';
import { roomApi, spendSql } from '../dist-api/rooms.js';

test('two independent seats share authoritative turns and reconnect safely', async () => {
  const db=new DatabaseSync(':memory:');
  db.exec("CREATE TABLE room_meter (bucket TEXT PRIMARY KEY,period TEXT NOT NULL,used INTEGER NOT NULL,secret TEXT NOT NULL DEFAULT(hex(randomblob(32))))");
  const spend=db.prepare(spendSql);
  let record=null;
  const store={
    async spend(bucket,period,limit){return spend.get(bucket,period,limit)},
    async read(){return structuredClone(record)},
    async save(_id,value,previous){
      if((record?.version ?? null)!==previous)return false;
      record=structuredClone(value);return true;
    }
  };
  const [id,host,guest,outsider]=Array.from({length:4},()=>crypto.randomUUID().replaceAll('-',''));
  async function call(token,body) {
    const req=new Request('https://game.test/api/rooms/'+id,{
      method:body?'POST':'GET',headers:{Authorization:'Bearer '+token},
      body:body?JSON.stringify(body):undefined
    });
    const res=await roomApi(req,store);return {status:res.status,...await res.json()};
  }
  async function proof(token,action){
    const check=await call(token,{action:'challenge',for:action});
    const result=await solveChallenge(check.challenge,check.salt,check.algorithm,check.maxnumber).promise;
    return {...check,number:result.number};
  }
  const create=await proof(host,'create');
  assert.equal((await call(host,{action:'create',count:2,long:false})).status,403);
  assert.equal((await call(outsider,{action:'create',count:2,long:false,proof:create})).status,403);
  assert.equal((await call(host,{action:'create',count:2,long:false,proof:create,avatar:'unknown'})).status,400);
  assert.equal((await call(host,{action:'create',count:2,long:false,proof:create,name:'   '})).status,400);
  const first=await call(host,{action:'create',count:2,long:false,proof:create,name:'Fox Fan',avatar:'🦊'});
  assert.equal(first.seat,0);
  assert.equal((await call(outsider)).status,403);
  assert.equal((await call(host,{action:'move',version:1,move:{from:'-2,2',to:'-4,4'}})).status,409);
  assert.equal((await call(guest,{action:'join',invite:'invalid'})).status,403);
  assert.equal((await call(guest,{action:'join',proof:await proof(guest,'join'),invite:first.invite})).status,400);
  const joined=await call(guest,{action:'join',proof:await proof(guest,'join'),invite:first.invite,name:'Tulip',avatar:'🌷'});
  assert.deepEqual(joined.avatars,{'0':'🦊','3':'🌷'});
  assert.deepEqual((await call(host)).avatars,joined.avatars);
  assert.deepEqual(joined.names,{'0':'Fox Fan','3':'Tulip'});
  assert.equal(joined.seat,3);assert.equal(joined.invite,undefined);
  assert.equal((await call(outsider,{action:'join',proof:await proof(outsider,'join'),invite:first.invite})).status,409);
  const action={action:'move',version:2,move:{from:'-2,2',to:'-4,4'}};
  assert.equal((await call(guest,action)).status,409);
  assert.equal((await call(host,{...action,move:{from:'-2,2',to:'0,8'}})).status,422);
  const results=await Promise.all([call(host,action),call(host,action)]);
  assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
  const seen=await call(guest);assert.equal(seen.game.board['-4,4'],0);
  assert.equal(seen.game.turn,1);
  const reply=await call(guest,{action:'move',version:seen.version,move:{from:'-2,14',to:'-4,12'}});
  assert.equal(reply.status,200);
  assert.deepEqual((await call(host)).game,reply.game);
  const undo={action:'move',version:reply.version,move:{undo:true}};
  assert.equal((await call(host,undo)).status,409);
  const restored=await call(guest,undo);
  assert.equal(restored.status,200);
  assert.deepEqual(restored.game.board,seen.game.board);
  assert.equal(restored.game.turn,seen.game.turn);
  assert.equal((await call(guest,undo)).status,409);
  const replay=await call(guest,{action:'move',version:restored.version,move:{from:'-2,14',to:'-4,12'}});
  assert.equal(replay.status,200);
  const rematch={action:'rematch',round:1};
  assert.equal((await call(host,rematch)).status,409);
  record.game.winner=true;
  const votes=await Promise.all([call(host,rematch),call(guest,rematch)]);
  assert.ok(votes.every(v=>v.status===200));
  const next=await call(guest);
  assert.equal(next.round,2);
  assert.deepEqual(next.game,first.game);
  assert.deepEqual(next.joined,joined.joined);
  assert.deepEqual(next.names,joined.names);
  assert.deepEqual(next.avatars,joined.avatars);
  assert.deepEqual(next.ready,[]);
  assert.equal((await call(host,rematch)).version,next.version);
  db.exec("UPDATE room_meter SET used=99999 WHERE bucket='monthly'");
  assert.deepEqual((await Promise.all([call(host),call(guest)])).map(r=>r.status).sort(),[200,429]);
  assert.equal((await call(host)).monthly,true);
  db.exec("UPDATE room_meter SET period='2000-01' WHERE bucket='monthly'");
  assert.equal((await call(guest)).status,200);
  db.exec("UPDATE room_meter SET used=36 WHERE bucket='admissions'");
  assert.equal((await call(host,{action:'challenge',for:'create'})).status,429);
  db.close();
});
