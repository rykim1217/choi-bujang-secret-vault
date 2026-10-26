import os from 'node:os';
import {statfs} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';

const failed = reason => ({status:'unknown', reason, measuredAt:new Date().toISOString(), source:'actual'});
const value = data => ({status:'ok', ...data, measuredAt:new Date().toISOString(), source:'actual'});
function counters() {
  const cores=os.cpus();
  if(!cores.length) throw Error('CPU_COUNTER_UNAVAILABLE');
  return cores.reduce((sum,core)=>({idle:sum.idle+core.times.idle,total:sum.total+Object.values(core.times).reduce((a,b)=>a+b,0)}),{idle:0,total:0});
}
export async function measurePc() {
  const cpuPromise=(async()=>{
    try {
      const first=counters(); await delay(1000); const last=counters();
      const total=last.total-first.total, idle=last.idle-first.idle;
      if(total<=0||idle<0||idle>total) return failed('CPU 측정 구간의 카운터를 확인할 수 없습니다.');
      return value({percent:100*(1-idle/total),unit:'%',intervalMs:1000});
    } catch { return failed('운영체제의 CPU 카운터를 읽지 못했습니다.'); }
  })();
  let memory;
  try {
    const total=os.totalmem(),free=os.freemem();
    if(total<=0||free<0||free>total) throw Error();
    memory=value({usedBytes:total-free,totalBytes:total,percent:100*(total-free)/total,unit:'bytes'});
  } catch { memory=failed('운영체제의 메모리 정보를 읽지 못했습니다.'); }
  const drive=process.platform==='win32'?`${process.env.SystemDrive||'C:'}\\`:'/';
  let disk;
  try {
    const stats=await statfs(drive),total=stats.blocks*stats.bsize,free=stats.bavail*stats.bsize;
    if(total<=0||free<0||free>total) throw Error();
    disk=value({freeBytes:free,totalBytes:total,percentFree:100*free/total,drive,unit:'bytes'});
  } catch(error) { disk=failed(error.code==='EACCES'||error.code==='EPERM'?'일반 권한으로 디스크 정보를 읽을 수 없습니다.':'시스템 드라이브의 남은 공간을 읽지 못했습니다.'); }
  return {source:'actual',cpu:await cpuPromise,memory,disk};
}
