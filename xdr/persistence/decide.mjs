const PATTERNS = Object.freeze({
  "schema": "aleph.xdr.patterns.v1",
  "moduleKey": "persistence",
  "patterns": [
    {
      "name": "unsigned_or_unfamiliar_service",
      "condition": "새 서비스 등록 또는 기존 서비스 실행 파일 변경에 서명 없음, 임시 폴더 실행 파일, 평소 목록 밖의 재시작 지속 등록 같은 구체적 이상 신호가 함께 있는지 확인한다. 서명 미확인은 서명 없음과 구분한다. 설명만 변경되거나 같은 파일로 재시작된 경우는 약한 확인 신호이며 단독 차단 근거로 쓰지 않는다. 기존 서명된 서비스의 정상 실행은 제외한다.",
      "evidence": "MITRE T1543은 서비스 생성·변경을 통한 지속 실행을 설명하며, 서명·경로·평소 목록 비교는 이 과제에서 적용하는 확인 조건이다.",
      "sources": ["https://attack.mitre.org/techniques/T1543/"]
    },
    {
      "name": "unfamiliar_scheduled_task",
      "condition": "새롭거나 낯선 예약 작업에 임시 폴더 실행 파일, 임의 문자열 이름, 평소와 다른 실행 시각 같은 이상 신호가 결합되는지 확인한다. 수업 시간 작업이나 과제와 비슷한 이름만 있고 승인 여부가 불명확하면 확인 대상으로만 남긴다. 평소 업데이트 예약과 기존 자료 복사 작업의 정상 완료는 제외하며, 기법 번호나 규칙 수준만으로 공격이라고 판단하지 않는다.",
      "evidence": "MITRE T1053은 예약 기능을 악용한 반복 실행을 설명하며, 낯선 이름·경로·시각의 결합은 이 과제의 확인 조건이다.",
      "sources": ["https://attack.mitre.org/techniques/T1053/"]
    },
    {
      "name": "startup_folder_change",
      "condition": "시작 폴더에 평소 목록 밖의 프로그램이 추가되거나 시작 프로그램과 예약 작업이 같은 임시 실행 파일을 가리키는지 확인한다. 시작 항목의 서명을 모르거나 변경만 있고 실행 증거가 없으면 약한 확인 신호로 남긴다. 목록 읽기만 한 경우는 제외한다. 임시 실행 파일 생성만으로 시작 등록이나 서비스 등록을 추정하지 않는다.",
      "evidence": "MITRE T1547.001은 시작 폴더 프로그램의 로그인 시 자동 실행을 설명하며, 함께 쓰인 예약 작업은 T1053에 해당한다; 시작 폴더 자체는 T1543으로 분류하지 않는다.",
      "sources": ["https://attack.mitre.org/techniques/T1547/001/", "https://attack.mitre.org/techniques/T1053/"]
    }
  ]
});
const PATTERN_NAMES = Object.freeze({
  service: PATTERNS.patterns[0].name,
  task: PATTERNS.patterns[1].name,
  startup: PATTERNS.patterns[2].name,
});

export function decide(alert) {
  const description = typeof alert?.rule?.description === 'string' ? alert.rule.description : '';
  const path = typeof alert?.data?.path === 'string' ? alert.data.path : '';
  const techniques = Array.isArray(alert?.rule?.mitre) ? alert.rule.mitre : [];
  const temp = /(?:^|[\\/])Temp[\\/][^\\/]+\.(?:exe|cmd|bat|ps1)$/iu.test(path);
  const startupPath = /[\\/]Start Menu[\\/]Programs[\\/]Startup[\\/]/iu.test(path);
  const service = /서비스/u.test(description);
  const task = /예약 작업/u.test(description);
  const startup = /시작 (?:폴더|프로그램|항목)/u.test(description);
  const unsigned = /서명 없는|서명이 없/u.test(description);
  const serviceChange = /새 서비스|서비스 등록|서비스 실행 파일이 바뀌|서비스가.*등록/u.test(description)
    && !/서비스 등록은 없/u.test(description);
  const unfamiliar = /처음 보는|평소 목록에 없는|임의 문자열/u.test(description);
  let confidence = 0;
  const names = [];
  function match(name, value) {
    names.push(name);
    confidence = Math.max(confidence, value);
  }
  if (service && serviceChange && ((unsigned && temp)
      || (unsigned && Number(alert?.data?.count) >= 3)
      || (unfamiliar && temp && /다시 켜도/u.test(description)))) {
    match(PATTERN_NAMES.service, 0.95);
  }
  if (task && temp && (unfamiliar || (startup && /함께 가리/u.test(description)))) {
    match(PATTERN_NAMES.task, 0.92);
  }
  if (startup && ((startupPath && unfamiliar && /추가/u.test(description))
      || (task && temp && /함께 가리/u.test(description)))) {
    match(PATTERN_NAMES.startup, 0.9);
  }
  // Weak evidence requires persistence context; MITRE tags alone do not match.
  if (!names.length && techniques.some(id => ['T1543', 'T1053', 'T1547.001'].includes(id))) {
    if (service && (/설명만.*바뀌|멈췄다가.*다시 시작/u.test(description)
        || /서비스 등록은 없/u.test(description) && temp)) match(PATTERN_NAMES.service, 0.55);
    if (task && /만들|작업이 하나|과제와 비슷/u.test(description)) match(PATTERN_NAMES.task, 0.6);
    if (startup && /서명은 아직 모|변경/u.test(description)) match(PATTERN_NAMES.startup, 0.6);
  }
  return {
    action: confidence >= 0.85 ? 'block' : confidence >= 0.5 ? 'alert' : 'record',
    confidence,
    reason: names.length ? names.join(' + ') : 'no_persistence_pattern',
  };
}
