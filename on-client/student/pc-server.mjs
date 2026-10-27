import {createOnServer} from '../src/server.mjs';
import {loadEngine,demoEngine} from '../src/engine.mjs';
import {readFile} from 'node:fs/promises';
import {measurePc} from './pc-metrics.mjs';
import {readSystemStatus} from './pc-system.mjs';

import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {readNativeHostConfiguration} from '../src/connection/native-context.mjs';
import {readSdpHostConfiguration} from '../src/engine/sdp-host-config.mjs';
import {createSdpHostEngine} from '../src/engine/sdp-host.mjs';
import {readActionStartupConfiguration} from '../src/actions/action-startup-config.mjs';
import {createProjectScanner} from '../src/vulnerabilities/project-scan.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
  const args=process.argv.slice(2);let demo=false,actions=false,nativePath,sdpPath,actionsPath;
  for(let i=0;i<args.length;i++){
    if(args[i]==='--demo'){demo=true;continue;}
    // C4: 조치는 --alekov-actions 와 --alekov-actions-config <절대경로> 를 함께 줄 때만 켠다. 각각 한 번만 받는다.
    if(args[i]==='--alekov-actions'&&!actions){actions=true;continue;}
    if(args[i]==='--native-host-config'&&nativePath===undefined&&typeof args[i+1]==='string'&&!args[i+1].startsWith('--')){nativePath=args[++i];continue;}
    if(args[i]==='--sdp-host-config'&&sdpPath===undefined&&typeof args[i+1]==='string'&&!args[i+1].startsWith('--')){sdpPath=args[++i];continue;}
    if(args[i]==='--alekov-actions-config'&&actionsPath===undefined&&typeof args[i+1]==='string'&&!args[i+1].startsWith('--')){actionsPath=args[++i];continue;}
    throw Error('UNKNOWN_ARGUMENT');
  }
  if(demo&&sdpPath!==undefined)throw Error('SDP_HOST_DEMO_CONFLICT');
  // 자원(native context·SDP host)을 만들기 전에 조합을 모두 거절한다: 한쪽만 준 경우, demo, native·SDP 설정 누락.
  if(actions!==(actionsPath!==undefined))throw Error('ACTION_STARTUP_INCOMPLETE');
  if(actions&&(demo||nativePath===undefined||sdpPath===undefined))throw Error('ACTION_STARTUP_CONFLICT');
  // 조치 설정은 파일 읽기만 하므로 native helper(registry·ACL 검사)를 부르기 전에 먼저 닫힌 schema 로 확인한다.
  const actionStartup=actions?readActionStartupConfiguration(actionsPath):null;
  const nativeHostConfiguration=nativePath===undefined?undefined:await readNativeHostConfiguration(nativePath);
  const sdpHost=sdpPath===undefined?null:createSdpHostEngine(await readSdpHostConfiguration(sdpPath,{projectRoot:resolve(root)}));
  let server;
  try{
    // 학생 모듈에는 본인 범위의 조회·판정 기능만 전달한다. 비밀·설정·종료·조치 기능은 호스트에 둔다(C4 도 이 목록을 늘리지 않는다).
    const hostCapability=sdpHost?Object.freeze({projectId:sdpHost.projectId,
      readIdentity:sdpHost.readIdentity.bind(sdpHost),readApps:sdpHost.readApps.bind(sdpHost),decideAccess:sdpHost.decideAccess.bind(sdpHost),
      readEvents:sdpHost.readEvents.bind(sdpHost),readDevices:sdpHost.readDevices.bind(sdpHost),readSessions:sdpHost.readSessions.bind(sdpHost)}):undefined;
    const engine=demo?demoEngine():await loadEngine(process.env.ON_ENGINE_ADAPTER??(sdpHost?resolve(root,'student/engine-adapter.mjs'):undefined),{hostCapability});
    let approvedPublicPackages=[];
    if(process.env.ON_APPROVED_PUBLIC_PACKAGES){try{approvedPublicPackages=JSON.parse(process.env.ON_APPROVED_PUBLIC_PACKAGES);}catch{throw Error('INVALID_PUBLIC_PACKAGE_LIST');}if(!Array.isArray(approvedPublicPackages))throw Error('INVALID_PUBLIC_PACKAGE_LIST');}
    const scanner=createProjectScanner({projectDirectory:process.env.ON_PROJECT_DIRECTORY,approvedPublicPackages});
    // 같은 createOnServer 안의 nativeHost 와 같은 owned sdpHost 만 조치 설정에 쓰인다(constructor 215–224행).
    server=createOnServer({engine,scanner,...(nativeHostConfiguration?{nativeHostConfiguration}:{}),...(sdpHost?{sdpHostEngine:sdpHost}:{}),
      ...(actionStartup?{sdpActionStartup:actionStartup.sdpActionStartup}:{})});
  }catch(error){sdpHost?.close();throw error;}
  if(sdpHost){server.once('close',()=>sdpHost.close());server.once('error',()=>sdpHost.close());}

async function readSdpStatus(){
  const checkedAt=new Date().toISOString();
  if(!sdpHost)return {status:'disconnected',reason:'SDP 개인 연결 설정이 지정되지 않았습니다. 기존 발급 경로에서 받은 설정 파일을 실행 도구의 -SdpHostConfig로 지정해야 합니다. 계정 로그인·PC 조회와는 별개입니다.',checkedAt};
  try{
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),6000);
    try{const identity=await sdpHost.readIdentity({signal:controller.signal});
      if(identity?.user?.id&&identity?.session?.status==='active')return {status:'connected',reason:'공식 SDP host에서 현재 신원과 활성 세션을 실제 조회했습니다.',checkedAt:new Date().toISOString()};
      return {status:'unknown',reason:'SDP에 응답은 있었지만 활성 신원·세션을 확인하지 못했습니다.',checkedAt:new Date().toISOString()};
    }finally{clearTimeout(timer);}
  }catch{return {status:'unknown',reason:'지정된 SDP 설정으로 현재 신원·권한을 확인하지 못했습니다. 개인 인증서·토큰의 유효 기간과 네트워크를 확인하세요. 인증 검증은 끄지 않습니다.',checkedAt:new Date().toISOString()};}
}
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
      systemRead??=Promise.all([readSystemStatus(),readSdpStatus()]).then(([data,sdp])=>({...data,sdp})).finally(()=>{systemRead=null;});
      const data=await systemRead;
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
