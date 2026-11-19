import assert from 'node:assert/strict';
import { test } from 'node:test';
import { roomApi } from '../dist-api/rooms.js';

test('two independent seats share authoritative turns and reconnect safely', async () => {
  let record=null;
  const store={
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
  assert.equal((await call(host,{action:'create',count:2,long:false,avatar:'unknown'})).status,400);
  const first=await call(host,{action:'create',count:2,long:false,avatar:'🦊'});
  assert.equal(first.seat,0);
  assert.equal((await call(outsider)).status,403);
  assert.equal((await call(host,{action:'move',version:1,move:{from:'-2,2',to:'-4,4'}})).status,409);
  assert.equal((await call(guest,{action:'join',invite:'invalid'})).status,403);
  const joined=await call(guest,{action:'join',invite:first.invite,avatar:'🌷'});
  assert.deepEqual(joined.avatars,{'0':'🦊','3':'🌷'});
  assert.deepEqual((await call(host)).avatars,joined.avatars);
  assert.equal(joined.seat,3);assert.equal(joined.invite,undefined);
  assert.equal((await call(outsider,{action:'join',invite:first.invite})).status,409);
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
});
