const PATTERNS = Object.freeze([
  {
    "name": "낯선 목적지 대량 반출",
    "conditions": "T1041/T1048 맥락에서 낯선 목적지 또는 외부 전체 복사 + 50MB 이상 + 다수 파일/압축/전체 복사 신호",
    "evidence": "T1041·T1048의 외부 반출 맥락을 신규 목적지와 전송량·파일 형태로 교차 확인한다. 50MB는 수업용 기준이며 MITRE 기준값이 아니다.",
    "sources": [
      "https://attack.mitre.org/techniques/T1041/",
      "https://attack.mitre.org/techniques/T1048/"
    ]
  },
  {
    "name": "반복 대량 전송",
    "conditions": "T1041/T1048 전송 맥락 + 50MB 이상 + 8회 이상 반복",
    "evidence": "T1041·T1048의 유출을 반복 전송과 전송량의 결합으로 의심한다. 8회는 수업용 기준이다.",
    "sources": [
      "https://attack.mitre.org/techniques/T1041/",
      "https://attack.mitre.org/techniques/T1048/"
    ]
  },
  {
    "name": "시간 밖 압축 반출",
    "conditions": "T1048 + 시간 밖 압축 파일의 낯선 목적지 전송 + 50MB 이상",
    "evidence": "T1048의 다른 통로 반출 맥락에 시간 밖 압축 전송이라는 수업 신호를 결합한다. 압축 또는 시간만으로 공격을 입증하지 않는다.",
    "sources": [
      "https://attack.mitre.org/techniques/T1048/"
    ]
  },
  {
    "name": "비일상 포트 대량 반출",
    "conditions": "T1048 + 평소 쓰지 않던 포트의 연속 자료 전송 + 50MB 이상",
    "evidence": "T1048은 다른 프로토콜을 통한 유출이다. 비일상 포트는 보조 신호이며 프로토콜 자체의 증거로 단정하지 않는다.",
    "sources": [
      "https://attack.mitre.org/techniques/T1048/"
    ]
  },
  {
    "name": "약한 반출 징후",
    "conditions": "T1041/T1048 + 신규 목적지·평소 대비 증가·압축 준비·전송 실패·명령 통로 흔적·일부 반출·불확실한 백업 중 하나",
    "evidence": "T1041·T1048 유출 맥락의 약한 신호는 확인 대상으로 알림만 남기며 반출 성공이나 공격으로 단정하지 않는다.",
    "sources": [
      "https://attack.mitre.org/techniques/T1041/",
      "https://attack.mitre.org/techniques/T1048/"
    ]
  }
]);

// Single-event evidence only: no history, destination reputation or identity is invented.
function numeric(value) {
  if (typeof value !== 'number' && typeof value !== 'string') return 0;
  if (typeof value === 'string' && !/^\d+(?:\.\d+)?$/u.test(value)) return 0;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
export function decide(alert) {
  const description = typeof alert?.rule?.description === 'string' ? alert.rule.description : '';
  const techniques = Array.isArray(alert?.rule?.mitre) ? alert.rule.mitre : [];
  const context = techniques.some(t => t === 'T1041' || t === 'T1048');
  if (!context) return {action:'record',confidence:0,reason:'해당 패턴 없음'};
  const data = alert?.data ?? {};
  const large = numeric(data.bytes) >= 50000000;
  const destination = typeof data.dstip === 'string' && data.dstip.length > 0;
  const unfamiliar = /처음 보|처음 봅|평소와 다른|다른 주소/u.test(description);
  const archive = /압축 파일/u.test(description);
  const outsideHours = /(?:업무|수업) 시간 밖/u.test(description);
  const whole = /자료실 전체.*외부/u.test(description);
  const transfer = /나갔|전송|올라갔|복사됐/u.test(description);
  const incomplete = /실패|전송은 아직 없|전송은 없/u.test(description);
  const names = [];
  if (destination && large && transfer && !incomplete) {
    if ((unfamiliar && (numeric(data.files) >= 20 || archive)) || whole) names.push(PATTERNS[0].name);
    if (numeric(data.count) >= 8 && /반복|전송/u.test(description)) names.push(PATTERNS[1].name);
    if (techniques.includes('T1048') && archive && outsideHours && unfamiliar) names.push(PATTERNS[2].name);
    if (techniques.includes('T1048') && /쓰지 않던 포트/u.test(description) && /연속 전송/u.test(description)) names.push(PATTERNS[3].name);
  }
  let confidence = names.length ? 0.9 : 0;
  if (!names.length && (unfamiliar || /평소보다|파일 수가.*늘|압축 파일|읽힌 뒤 전송|백업처럼|명령 통로|전송.*실패/u.test(description))) {
    names.push(PATTERNS[4].name);
    confidence = 0.6;
  }
  return {action:confidence >= 0.85 ? 'block' : confidence >= 0.5 ? 'alert' : 'record', confidence, reason:names.join(' + ') || '해당 패턴 없음'};
}
