import {createOnServer} from '../src/server.mjs';
import {loadEngine,demoEngine} from '../src/engine.mjs';
import {readFile} from 'node:fs/promises';
import {measurePc} from './pc-metrics.mjs';
import {readSystemStatus} from './pc-system.mjs';

const engine=process.argv.includes('--demo')?demoEngine():await loadEngine(process.env.ON_ENGINE_ADAPTER);
const server=createOnServer({engine});
const original=server.listeners('request');
server.removeAllListeners('request');
let measurement;
let systemRead;
const assets=new Map([
  ['/student/pc-system-view.mjs',['pc-system-view.mjs','text/javascript']],
  ['/student/pc-dashboard.mjs',['pc-dashboard.mjs','text/javascript']],
  ['/student/pc-dashboard.css',['pc-dashboard.css','text/css']],
]);
server.on('request',async(req,res)=>{
  const port=server.address()?.port;
  const host=req.headers.host;
  if(![`127.0.0.1:${port}`,`localhost:${port}`].includes(host)||req.headers['sec-fetch-site']==='cross-site'){
    res.writeHead(403);res.end('로컬 앱 주소에서 확인하세요.');return;
  }
  const path=req.url;
  if(!['/','/index.html','/api/pc-status','/api/pc-system',...assets.keys()].includes(path)){
    for(const listener of original) listener.call(server,req,res);return;
  }
  if(req.method!=='GET'){res.writeHead(405,{'Allow':'GET'});res.end();return;}
  const headers={'cache-control':'no-store','x-content-type-options':'nosniff','content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'none'"};
  try {
    if(path==='/api/pc-system'){
      systemRead??=readSystemStatus().finally(()=>{systemRead=null;});
      const data=await systemRead;
      // This launch path does not configure an SDP host. Adapter mode alone is not proof of SDP connectivity.
      data.sdp={status:'disconnected',reason:'현재 실행 경로에 실제 SDP 호스트 연결이 구성되지 않았습니다.',checkedAt:new Date().toISOString()};
      res.writeHead(200,{...headers,'content-type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));return;
    }
    if(path==='/api/pc-status'){
      // Concurrent clicks share a single measurement; no privileged commands or external requests.
      measurement??=measurePc().finally(()=>{measurement=null;});
      const data=await measurement;
      res.writeHead(200,{...headers,'content-type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));return;
    }
    let body,type;
    if(assets.has(path)){
      const [file,mime]=assets.get(path);body=await readFile(new URL(file,import.meta.url));type=mime;
    }else{
      body=await readFile(new URL('../public/index.html',import.meta.url),'utf8');type='text/html';
    }
    res.writeHead(200,{...headers,'content-type':`${type}; charset=utf-8`});res.end(body);
  }catch{res.writeHead(503,{...headers,'content-type':'application/json; charset=utf-8'});res.end(JSON.stringify({error:'PC 상태를 조회하지 못했습니다.'}));}
});
const port=Number(process.env.ON_PORT??5189);
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('INVALID_PORT');
server.listen(port,'127.0.0.1',()=>console.log(`라요 PC 대시보드: http://127.0.0.1:${port}/`));
