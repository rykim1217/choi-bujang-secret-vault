const PATTERNS = Object.freeze({
  "schema": "aleph.xdr.patterns.v1",
  "moduleKey": "privilege",
  "patterns": [
    {
      "name": "unexpected_admin_group_change",
      "condition": "관리자 그룹 추가에 원격 접근, 평범한 계정, 즉시 명령 실행, 여러 계정 추가 또는 제거 직후 재추가가 결합되면 강한 신호다. 승인된 변경은 제외한다. 과제 그룹 추가·로컬 그룹 생성·그룹 설명 변경은 T1078 맥락에서도 확인 알림만 남긴다.",
      "evidence": "T1078은 도용한 정상 계정의 권한 악용을 설명하며, 그룹 변경과 추가 이상 신호의 결합은 이 실습의 탐지 조건이다.",
      "sources": ["https://attack.mitre.org/techniques/T1078/"]
    },
    {
      "name": "unfamiliar_privileged_execution",
      "condition": "방금 얻은 관리자 권한의 명령 실행, 다른 계정 권한의 관리자 명령 또는 처음 보는 주소에서 관리자 권한으로 세션 변경은 강한 신호다. 단발 실행·실패·취소·실행 없는 권한 상승·계정 종류 조회는 관련 맥락이 있어도 확인 알림만 남긴다. 기법 번호와 규칙 수준만으로 차단하지 않는다.",
      "evidence": "T1068은 취약점 악용에 의한 권한 상승, T1078은 계정 권한 악용을 설명하며, 관리자 실행 경보만으로 취약점 악용 자체를 입증하지 않는다.",
      "sources": ["https://attack.mitre.org/techniques/T1068/", "https://attack.mitre.org/techniques/T1078/"]
    },
    {
      "name": "off_hours_privilege_use",
      "condition": "수업·업무 시간 밖이라고 경보가 명시한 관리자 명령에 낯선 주소 또는 관리자 그룹 추가가 함께 있으면 강한 신호다. 시간 밖 권한 사용만 있으면 알림이다. 업무 시간 기준이 없으므로 시각에서 임의로 업무 시간을 추정하지 않는다.",
      "evidence": "T1078의 정상 계정 악용 탐지에 평소 사용 맥락 비교를 적용한 실습 조건이며, 시간 밖 사용만으로 악용을 확정하지 않는다.",
      "sources": ["https://attack.mitre.org/techniques/T1078/"]
    }
  ]
});
function result(confidence, names) {
  return { action: confidence >= 0.85 ? 'block' : confidence >= 0.5 ? 'alert' : 'record', confidence, reason: names.length ? names.join(' + ') : 'no_privilege_pattern' };
}

export function decide(alert) {
  const description = typeof alert?.rule?.description === 'string' ? alert.rule.description : '';
  const techniques = Array.isArray(alert?.rule?.mitre) ? alert.rule.mitre : [];
  const relevant = techniques.some(value => value === 'T1068' || value === 'T1078');
  const group = typeof alert?.data?.group === 'string' ? alert.data.group.toLowerCase() : '';
  const adminGroup = group === 'administrators' || /관리자 그룹/.test(description) && !/관리자 그룹은 아닙니다/.test(description);
  const added = /추가|들어가|들어왔|들어오/.test(description);
  const command = /(?:관리자|권한) 명령.*실행|명령 실행/.test(description) && !/명령은 없|실행.*없|실패|취소/.test(description);
  const offHours = /시간 밖|업무처럼 보이지 않는 시각/.test(description);
  const unfamiliar = /처음 보는|처음 봅니다|낯선/.test(description);
  const approved = /승인된|승인받은|정상적인|정상 변경/.test(description);
  if (approved) return result(0.1, []);
  const names = [];
  if (adminGroup && added) names.push(PATTERNS.patterns[0].name);
  if (command || /권한 상승|관리자 권한으로 바뀌/.test(description)) names.push(PATTERNS.patterns[1].name);
  if (offHours && (command || adminGroup)) names.push(PATTERNS.patterns[2].name);
  const strongGroup = adminGroup && added && (/원격|평범한 계정|곧바로|같이|다시/.test(description) || command || Number(alert?.data?.count) >= 3);
  const strongExecution = command && (/방금 관리자가 된|다른 계정의 권한/.test(description) || offHours && unfamiliar);
  const changedSession = /세션.*관리자 권한으로 바뀌/.test(description) && unfamiliar;
  if (strongGroup || strongExecution || changedSession) return result(0.95, names);
  if (names.length) return result(0.6, names);
  // Weak account/group changes need technique context; a tag alone is insufficient.
  if (relevant && /권한 상승|관리자 명령|계정 종류.*조회|(?:과제|로컬) 그룹.*(?:추가|만들)|그룹.*설명.*바뀌/.test(description)) {
    return result(0.55, [PATTERNS.patterns[/그룹/.test(description) ? 0 : 1].name]);
  }
  return result(0.1, []);
}