import {createSystemView} from './pc-system-view.mjs';
const el=(tag,text,className)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;};
const root=el('section',undefined,'pc-dashboard');root.setAttribute('aria-labelledby','pc-title');
const heading=el('h1','내 PC 상태');heading.id='pc-title';
root.append(heading,el('p','학생 추가 기능 · 이 PC의 실제 측정 · 관리자 권한 사용 안 함','pc-note'));
const help=el('details',undefined,'pc-help');help.append(el('summary','측정값과 그래프 읽는 법'),el('p','이 PC에서 직접 측정한 값입니다. CPU·메모리는 사용 비율, 디스크는 남은 비율입니다. 버튼을 누를 때만 갱신하며, 기존 보안 연결 상태와 별개로 작동합니다. GB는 10진 단위입니다.','pc-note'));root.append(help);
const button=el('button','다시 조회','btn');button.type='button';
const live=el('p','측정 전입니다.','pc-note');live.setAttribute('role','status');
const cards=el('div',undefined,'pc-cards');
const chart=el('section',undefined,'pc-chart');
const log=el('section',undefined,'pc-log');
const toolbar=el('div',undefined,'pc-toolbar');toolbar.append(button,live);
const errors=el('section',undefined,'pc-query-errors');errors.hidden=true;errors.setAttribute('role','alert');
root.append(toolbar,errors,cards,chart,log);
const main=document.querySelector('#main');
const security=el('details',undefined,'pc-security');security.append(el('summary','기존 보안 기능 펼쳐 보기 · 계정·업무 앱·보안 기록'));
while(main.firstChild)security.append(main.firstChild);
const sidebar=document.querySelector('.sidebar');
main.append(root,security);
const systemView=createSystemView();main.insertBefore(systemView,security);
const nav=document.querySelector('#nav');
const extraNav=el('div',undefined,'pc-extra-nav');
const menuItems=[['내 PC 상태',root,null],['연결·Windows 기록',systemView,null],['보호 현황',security,'tab-protection'],['업무 앱',security,'tab-apps'],['보안 기록',security,'tab-records']];
function selectMenu(index){
  const [,view,target]=menuItems[index];
  if(target)document.getElementById(target).click();
  root.hidden=view!==root;systemView.hidden=view!==systemView;security.hidden=view!==security;
  if(view===security)security.open=true;
  [...extraNav.children].forEach((item,i)=>{
    if(i===index)item.setAttribute('aria-current','page');else item.removeAttribute('aria-current');
  });
}
menuItems.forEach(([label],index)=>{
  const item=el('button',label);item.type='button';
  item.addEventListener('click',()=>selectMenu(index));
  item.addEventListener('keydown',event=>{
    let next;
    if(event.key==='ArrowDown')next=(index+1)%menuItems.length;
    if(event.key==='ArrowUp')next=(index+menuItems.length-1)%menuItems.length;
    if(event.key==='Home')next=0;
    if(event.key==='End')next=menuItems.length-1;
    if(next===undefined)return;
    event.preventDefault();extraNav.children[next].focus();selectMenu(next);
  });extraNav.append(item);
});
sidebar.insertBefore(extraNav,nav);
nav.hidden=true;
selectMenu(0);
let rows=[];
const number=n=>n.toLocaleString('ko-KR',{maximumFractionDigits:1});
const gb=n=>number(n/1e9);
const time=t=>new Date(t).toLocaleString('ko-KR',{hour12:false});
function render(){
  errors.replaceChildren();
  const latest=rows.at(-1);
  const failures=latest?[['cpu','CPU 사용률'],['memory','메모리 사용량'],['disk','디스크 남은 공간']].filter(([key])=>latest[key].status!=='ok'):[];
  errors.hidden=!failures.length;
  if(failures.length){errors.append(el('strong','일부 항목을 읽지 못했습니다.'));for(const [key,label] of failures)errors.append(el('p',`${label}: ${latest[key].reason}`));errors.append(el('p','다음 할 일: 앱 실행 창이 켜져 있는지 확인한 뒤 「다시 조회」를 누르세요. 권한이 필요한 항목은 관리자 실행이나 설정 변경 없이 확인 불가로 남깁니다.'));}
  cards.replaceChildren();const current=rows.at(-1), previous=rows.at(-2);
  for(const [key,title] of [['cpu','CPU 사용률'],['memory','메모리 사용량'],['disk','디스크 남은 공간']]){
    const card=el('article',undefined,'pc-card');card.append(el('h2',title));const m=current?.[key];
    if(m?.status==='ok'){
      const text=key==='cpu'?`${number(m.percent)} %`:key==='memory'?`${gb(m.usedBytes)} / ${gb(m.totalBytes)} GB · ${number(m.percent)} %`:`${gb(m.freeBytes)} / ${gb(m.totalBytes)} GB · ${number(m.percentFree)} % 남음`;
      card.append(el('p',text,'pc-value'));
      const meter=el('meter');meter.min=0;meter.max=100;meter.value=key==='disk'?m.percentFree:m.percent;meter.setAttribute('aria-label',title);meter.className='pc-meter-'+key;card.append(meter);
      card.append(el('p',`실제 측정 · ${time(m.measuredAt)}`,'pc-note'));
      if(key==='cpu')card.append(el('p','전체 CPU · 약 1초 구간 평균','pc-note'));
      if(key==='disk')card.append(el('p',`대상: ${m.drive} · 일반 사용자에게 사용 가능한 공간`,'pc-note'));
      if(key==='memory')card.append(el('p','운영체제의 전체 물리 메모리 − 여유 메모리','pc-note'));
      const p=previous?.[key];
      if(p?.status==='ok'){
        const diff=key==='cpu'?m.percent-p.percent:key==='memory'?(m.usedBytes-p.usedBytes)/1e9:(m.freeBytes-p.freeBytes)/1e9;
        card.append(el('p',`직전 대비 ${diff>0?'+':''}${number(diff)} ${key==='cpu'?'%p':'GB'}`,'pc-compare'));
      }else card.append(el('p','비교하려면 한 번 더 측정하세요.','pc-note'));
    }else{
      card.append(el('p',m?'확인 불가':'측정 전','pc-value'),el('p',m?.reason??'다시 조회를 눌러 주세요.','pc-note'));
      if(m)card.append(el('p',`조회 시각 · ${time(m.measuredAt)}`,'pc-note'));
    }
    cards.append(card);
  }
  const status=el('article',undefined,'pc-card');status.append(el('h2','측정 상태'));
  const ok=current?['cpu','memory','disk'].filter(k=>current[k].status==='ok').length:0;
  status.append(el('p',current?(ok===3?'측정 완료':`${3-ok}개 항목 확인 불가`):'측정 전','pc-value'),el('p',`이 화면을 연 동안 최근 ${rows.length}회 보관 · 최대 30회`,'pc-note'),el('p','GB = 1,000,000,000 bytes. 작업 관리자와 단위·측정 시점에 따라 차이가 날 수 있습니다.','pc-note'));cards.append(status);
  chart.replaceChildren(el('h2','최근 측정 변화'),el('p','왼쪽은 이전, 오른쪽은 최근 · 「다시 조회」를 누를 때 갱신','pc-note'));
  const legend=el('div',undefined,'pc-unified-legend');chart.append(legend);
  const ns='http://www.w3.org/2000/svg';
  const plotWidth=Math.max(240,chart.clientWidth-26);
  const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 '+plotWidth+' 155');svg.setAttribute('role','img');svg.setAttribute('aria-label','CPU 사용률, 메모리 사용률, 디스크 남은 비율 변화. 정확한 수치는 아래 기록 표에서 확인하세요.');
  for(const percent of [0,50,100]){
    const y=125-percent;const line=document.createElementNS(ns,'line');
    for(const [k,v] of Object.entries({x1:42,x2:plotWidth-20,y1:y,y2:y,stroke:'#353c56'}))line.setAttribute(k,String(v));svg.append(line);
    const tick=document.createElementNS(ns,'text');tick.setAttribute('x','0');tick.setAttribute('y',String(y+4));tick.textContent=`${percent}%`;svg.append(tick);
  }
  for(const [key,label,color] of [['cpu','CPU 사용','#a78bfa'],['memory','메모리 사용','#5ee4bd'],['disk','디스크 남음','#facc15']]){
    const latest=current?.[key];const percent=m=>key==='disk'?m.percentFree:m.percent;
    legend.append(el('span',`${label} · ${latest?.status==='ok'?number(percent(latest))+'%':latest?'확인 불가':'측정 전'}`,`pc-${key}`));
    let prev=null;
    rows.forEach((row,i)=>{
      const m=row[key];if(m.status!=='ok'){prev=null;return;}
      const x=45+i*(plotWidth-65)/Math.max(1,rows.length-1),y=125-percent(m);
      if(prev){const line=document.createElementNS(ns,'line');for(const [k,v] of Object.entries({x1:prev.x,y1:prev.y,x2:x,y2:y,stroke:color,'stroke-width':2}))line.setAttribute(k,String(v));svg.append(line);}
      const dot=document.createElementNS(ns,'circle');for(const [k,v] of Object.entries({cx:x,cy:y,r:3,fill:color}))dot.setAttribute(k,String(v));
      const tip=document.createElementNS(ns,'title');tip.textContent=`${label} ${number(percent(m))}% · ${time(m.measuredAt)}`;dot.append(tip);svg.append(dot);prev={x,y};
    });
  }
  chart.append(svg);
  const range=el('div',undefined,'pc-range');range.append(el('span',rows.length?`첫 측정 ${new Date(rows[0].cpu.measuredAt).toLocaleTimeString('ko-KR',{hour12:false})}`:'이전'),el('span',current?`최근 ${new Date(current.cpu.measuredAt).toLocaleTimeString('ko-KR',{hour12:false})}`:'최근'));chart.append(range);
  chart.append(el('p',rows.length<2?'한 번 더 측정하면 변화가 선으로 이어져요.':'CPU·메모리: 높을수록 많이 사용 중 / 디스크: 낮을수록 남은 공간이 적음','pc-note'));
  log.replaceChildren(el('h2','최근 측정 기록'));
  const table=el('table');const head=el('tr');for(const t of ['조회 시각','CPU (%)','메모리 (GB)','디스크 남음 (GB)']){const th=el('th',t);th.scope='col';head.append(th);}table.append(head);
  for(const row of [...rows].reverse()){
    const tr=el('tr');tr.append(el('td',time(row.cpu.measuredAt)));
    for(const key of ['cpu','memory','disk']){const m=row[key];const td=el('td',m.status==='ok'?(key==='cpu'?number(m.percent):gb(key==='memory'?m.usedBytes:m.freeBytes)):`확인 불가: ${m.reason}`);td.title=`${m.status==='ok'?'측정':'조회'} 시각: ${time(m.measuredAt)}`;tr.append(td);}table.append(tr);
  }log.append(table);
}
async function measure(){
  if(button.disabled)return;
  const restoreFocus=document.activeElement===button;
  button.disabled=true;root.setAttribute('aria-busy','true');live.classList.add('pc-loading');live.textContent='새로 읽는 중… CPU는 약 1초가 걸립니다. 이전 값은 표시된 측정 시각 기준입니다.';
  try{
    const response=await fetch('/api/pc-status',{signal:AbortSignal.timeout(8000),cache:'no-store'});
    if(!response.ok)throw Error();const data=await response.json();
    if(data.source!=='actual'||!['cpu','memory','disk'].every(k=>data[k]&&['ok','unknown'].includes(data[k].status)&&Number.isFinite(Date.parse(data[k].measuredAt))))throw Error();
    rows.push(data);rows=rows.slice(-30);live.textContent='측정을 마쳤습니다. 각 항목의 상태와 시각을 확인하세요.';
  }catch{
    const failed={status:'unknown',source:'actual',measuredAt:new Date().toISOString(),reason:'로컬 측정 서버의 응답을 확인할 수 없습니다. 서버 실행 상태를 확인하세요.'};
    rows.push({source:'actual',cpu:{...failed},memory:{...failed},disk:{...failed}});rows=rows.slice(-30);live.textContent='확인 불가 · 이전 값을 현재 값으로 표시하지 않습니다.';
  }finally{button.disabled=false;root.setAttribute('aria-busy','false');live.classList.remove('pc-loading');render();if(restoreFocus)button.focus({preventScroll:true});}
}
button.addEventListener('click',measure);render();measure();

let lastPlotWidth=0;
new ResizeObserver(()=>{const width=chart.clientWidth;if(width!==lastPlotWidth){lastPlotWidth=width;render();}}).observe(chart);
