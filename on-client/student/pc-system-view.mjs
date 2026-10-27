const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const time=t=>t?new Date(t).toLocaleString('ko-KR',{hour12:false}):'조회 전';
export function createSystemView(){
  const root=el('section',undefined,'pc-dashboard pc-system');root.hidden=true;
  root.append(el('h1','연결·Windows 기록'),el('p','실제 PC 조회 · 읽기 전용 · 보안 설정을 변경하지 않습니다.','pc-note'));
  root.append(el('p','Windows 경고·오류 건수는 침해나 공격 탐지 결과가 아닙니다.','pc-disclaimer'));
  const button=el('button','다시 조회','btn');button.type='button';
  const message=el('p','다시 조회를 눌러 현재 PC 구성을 확인하세요.','pc-note');message.setAttribute('role','status');
  const toolbar=el('div',undefined,'pc-toolbar');toolbar.append(button,message);
  const cards=el('div',undefined,'pc-cards'),details=el('details',undefined,'pc-log pc-fold'),history=el('details',undefined,'pc-log pc-fold');
  const errors=el('section',undefined,'pc-query-errors');errors.hidden=true;errors.setAttribute('role','alert');
  root.append(toolbar,errors,cards,details,history);let records=[];
  function render(data){
    errors.replaceChildren();
    const failed=data?[['네트워크 구성',data.network],['방화벽 설정',data.firewall],['System 기록',data.logs.System],['Application 기록',data.logs.Application]].filter(([,v])=>v.status!=='ok'):[];
    errors.hidden=!failed.length;
    if(failed.length){errors.append(el('strong','조회하지 못한 항목이 있습니다.'));for(const [name,value] of failed)errors.append(el('p',`${name}: ${value.reason}`));errors.append(el('p','다음 할 일: 앱 실행 창을 확인한 뒤 「다시 조회」를 누르세요. 권한 부족이면 설정을 바꾸거나 관리자 권한으로 실행하지 말고 확인 불가로 남겨 두세요.'));}
    cards.replaceChildren();details.replaceChildren(el('summary','자세히 보기 · 네트워크 구성과 방화벽 프로필'));
    const paths=['M4 12a8 8 0 1 0 16 0 8 8 0 1 0-16 0 M8 12a4 4 0 1 0 8 0 4 4 0 1 0-8 0','M12 3 21 12 12 21 3 12Z','M5 4h14v16H5Z M8 8h8 M8 12h8 M8 16h8','M4 8h16 M15 3l5 5-5 5 M20 16H4 M9 11l-5 5 5 5'];
    const make=(title,text,note)=>{const index=cards.children.length;const card=el('article',undefined,`pc-card pc-system-card pc-system-card-${index}`);const icon=el('span',undefined,'pc-status-icon');icon.setAttribute('aria-hidden','true');const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',paths[index]);svg.append(path);icon.append(svg);card.append(icon,el('h2',title),el('p',text,'pc-value'),el('p',note,'pc-note'));cards.append(card);};
    const network=data?.network,fw=data?.firewall;
    const adapters=network?.status==='ok'?[network.data].flat().filter(Boolean):[];
    const up=adapters.filter(a=>a.status==='Up');
    make('네트워크 구성',network?(network.status==='ok'?(up.length?`${up.length}개 연결`:'연결 없음'):'확인 불가'):'조회 전',network?.status==='unknown'?network.reason:network?`실제 조회 · ${time(network.measuredAt)}`:'인터넷 접속 여부와는 별개예요');
    const profiles=fw?.status==='ok'?[fw.data].flat().filter(Boolean):[];
    const enabled=profiles.filter(p=>p.enabled==='True').length;
    make('방화벽 설정',fw?(fw.status==='ok'?`${enabled} / ${profiles.length} 켜짐`:'확인 불가'):'조회 전',fw?.status==='unknown'?fw.reason:fw?`읽기 전용 · ${time(fw.measuredAt)}`:'도메인·개인·공용 프로필');
    const logs=data?.logs;const readable=logs&&['System','Application'].every(k=>logs[k]?.status==='ok');
    make('Windows 기록 · 최근 24시간',logs?(readable?`경고 ${logs.System.data.warnings+logs.Application.data.warnings} · 오류 ${logs.System.data.errors+logs.Application.data.errors}`:'확인 불가 항목 있음'):'조회 전',logs?`단위: 건 · 조회 ${time(logs.Application.measuredAt)}`:'System · Application');
    const sdp=data?.sdp;
    make('SDP 연결',!sdp?'조회 전':sdp.status==='connected'?'SDP 연결 확인':sdp.status==='disconnected'?'SDP 미연결':'SDP 확인 불가',sdp?.reason??'PC 조회 성공과 별도로 확인해요');
    if(sdp){details.append(el('h3','SDP 서버 연결 확인'),el('p',sdp.reason),el('p',`확인 시각: ${time(sdp.checkedAt)}`));}
    if(network){details.append(el('h3','네트워크 · 인터넷 접속 성공을 뜻하지 않습니다.'));if(network.status==='unknown')details.append(el('p',network.reason));
      for(const a of adapters){const section=el('div',undefined,'pc-detail-row');section.append(el('strong',`${a.name} · ${a.status==='Up'?'연결됨':a.status==='Disconnected'?'연결 끊김':a.status}`),el('p',a.description),el('p',`IP: ${(a.addresses??[]).filter(Boolean).join(', ')||'없음'} / 게이트웨이: ${(a.gateways??[]).filter(Boolean).join(', ')||'없음'}`));details.append(section);}}
    if(fw){details.append(el('h3','방화벽 프로필 · 현재 적용 설정 저장소'));for(const p of profiles)details.append(el('p',`${({Domain:'도메인',Private:'개인',Public:'공용'})[p.name]??p.name}: ${p.enabled==='True'?'켜짐':p.enabled==='False'?'꺼짐':'확인 불가'}`));if(fw.status==='unknown')details.append(el('p',fw.reason));}
    if(logs){details.append(el('h3','Windows 기록 조회 범위'),el('p',`${time(data.windowStart)} ~ ${time(data.windowEnd)} · 수준: 경고(3), 오류(2)`));for(const name of ['System','Application']){const l=logs[name];details.append(el('p',`${name}: ${l.status==='ok'?`경고 ${l.data.warnings}건 / 오류 ${l.data.errors}건`:`확인 불가 · ${l.reason}`} · 조회 시각 ${time(l.measuredAt)}`));}}
    history.replaceChildren(el('summary',`조회 기록 보기 · ${records.length}회`));
    for(const row of records.slice().reverse())history.append(el('p',`${time(row.at)} · 네트워크 ${row.network} · 방화벽 ${row.firewall} · Windows 기록 ${row.logs}`,'pc-note'));
    if(!records.length)history.append(el('p','아직 조회하지 않았습니다.','pc-note'));
  }
  button.addEventListener('click',async()=>{
    if(button.disabled)return;
    const restoreFocus=document.activeElement===button;
    button.disabled=true;root.setAttribute('aria-busy','true');message.classList.add('pc-loading');message.textContent='새로 읽는 중… 최대 25초 정도 걸릴 수 있습니다. 이전 값은 표시된 조회 시각 기준입니다.';
    let data;
    try{const r=await fetch('/api/pc-system',{cache:'no-store',signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error();data=await r.json();if(data.source!=='actual'||!data.logs)throw Error();}
    catch{const unknown={status:'unknown',reason:'로컬 조회 서버의 응답을 확인하지 못했습니다.',measuredAt:new Date().toISOString()};data={network:unknown,firewall:unknown,logs:{System:unknown,Application:unknown},sdp:{status:'unknown',reason:'연결 상태를 조회하지 못했습니다.'}};}
    records.push({at:new Date().toISOString(),network:data.network.status==='ok'?'조회됨':'확인 불가',firewall:data.firewall.status==='ok'?'조회됨':'확인 불가',logs:['System','Application'].every(k=>data.logs[k].status==='ok')?'조회됨':'확인 불가'});records=records.slice(-10);
    render(data);message.textContent=errors.hidden?'조회를 마쳤습니다. 각 항목의 조회 시각을 확인하세요.':'확인 불가 항목이 있습니다. 아래 실패 이유와 다음 할 일을 확인하세요.';button.disabled=false;root.setAttribute('aria-busy','false');message.classList.remove('pc-loading');if(restoreFocus)button.focus({preventScroll:true});
  });render();return root;
}
