// Azure App Service or local Node server. Run one instance with a persistent data directory.
import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { roomApi } from '../dist-api/rooms.js';

const data = process.env.ROOM_DATA_DIR || (process.env.WEBSITE_SITE_NAME ? resolve(process.env.HOME,'data','emotion-checkers') : '.room-data');
mkdirSync(data,{recursive:true});
const db = new DatabaseSync(resolve(data,'rooms.sqlite'));
db.exec('CREATE TABLE IF NOT EXISTS rooms (id TEXT PRIMARY KEY, version INTEGER NOT NULL, data TEXT NOT NULL)');
const read = db.prepare('SELECT data FROM rooms WHERE id=?');
const insert = db.prepare('INSERT OR IGNORE INTO rooms VALUES(?,?,?)');
const update = db.prepare('UPDATE rooms SET version=?,data=? WHERE id=? AND version=?');
const store = {
  async read(id) {const row=read.get(id);return row ? JSON.parse(row.data) : null},
  async save(id,room,previous) {const json=JSON.stringify(room);return (previous===null ? insert.run(id,room.version,json) : update.run(room.version,json,id,previous)).changes===1}
};
const root=resolve('dist');
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.svg':'image/svg+xml'};
createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,'http://localhost');
    if(url.pathname.startsWith('/api/rooms/')) {
      let body='';
      for await(const chunk of req){body+=chunk;if(body.length>8192){res.writeHead(413).end();return}}
      const request=new Request(url,{method:req.method,headers:req.headers,...(req.method==='POST'?{body}:{})});
      const reply=await roomApi(request,store);
      res.writeHead(reply.status,Object.fromEntries(reply.headers)).end(await reply.text());
      return;
    }
    const file=resolve(root,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));
    if(!file.startsWith(root+sep) || !statSync(file,{throwIfNoEntry:false})?.isFile()){res.writeHead(404).end();return}
    res.writeHead(200,{'Content-Type':mime[extname(file)] || 'application/octet-stream'}).end(readFileSync(file));
  }catch{res.writeHead(500).end('Unable to serve request')}
}).listen(Number(process.env.PORT || 3000));
