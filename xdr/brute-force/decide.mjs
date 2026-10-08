const PATTERNS = Object.freeze([
  Object.freeze({
    name: 'rapid_same_source_failures',
    condition: '짧은 시간 창에서 같은 data.srcip의 로그인 실패가 연속으로 누적되는 경보',
    evidence: 'MITRE ATT&CK T1110은 반복적·체계적인 인증 시도로 비밀번호를 추측하는 무차별 대입을 설명한다.',
  }),
  Object.freeze({
    name: 'same_password_across_accounts',
    condition: '같은 data.srcip가 여러 계정에 동일한 비밀번호를 반복 대입한 경보',
    evidence: 'MITRE ATT&CK T1110은 계정 또는 계정 집합을 대상으로 반복적으로 비밀번호를 시도하는 무차별 대입을 설명한다.',
  }),
]);

const SOURCE_RE = /(?:같은 주소|한 주소|동일한 주소|same (?:source|address)|single source)/iu;
const LOGIN_FAILURE_RE = /(?:로그인|인증).*(?:실패|failure|failed)/iu;
const SHORT_WINDOW_RE = /(?:짧은 시간|\d+\s*(?:분|minute|min)\s*(?:안|동안|within)?)/iu;
const REPEATED_FAILURE_RE = /(?:연속|이어졌|쌓였|반복|repeated|consecutive)/iu;
const SAME_PASSWORD_RE = /(?:같은 비밀번호|동일한 비밀번호|same password)/iu;
const MULTIPLE_ACCOUNTS_RE = /(?:여러 계정|서로 다른 계정|계정\s*\d+개|multiple accounts?|several accounts?)/iu;

function descriptionOf(alert) {
  return typeof alert?.rule?.description === 'string' ? alert.rule.description : '';
}

function hasSourceAddress(alert) {
  return typeof alert?.data?.srcip === 'string' && alert.data.srcip.trim().length > 0;
}

function failureCountOf(alert) {
  const count = Number(alert?.data?.count);
  return Number.isFinite(count) ? count : 0;
}

function rapidSameSourceConfidence(alert, description) {
  if (!hasSourceAddress(alert) || !SOURCE_RE.test(description) || !LOGIN_FAILURE_RE.test(description)) {
    return 0;
  }

  const repeated = REPEATED_FAILURE_RE.test(description) || failureCountOf(alert) >= 5;
  if (SHORT_WINDOW_RE.test(description) && repeated) return 0.95;
  if (repeated) return 0.65;
  return 0;
}

function samePasswordAcrossAccountsConfidence(alert, description) {
  if (!hasSourceAddress(alert) || !SAME_PASSWORD_RE.test(description)) return 0;
  if (MULTIPLE_ACCOUNTS_RE.test(description)) return 0.95;
  return 0.35;
}

function actionFor(confidence) {
  if (confidence >= 0.85) return 'block';
  if (confidence >= 0.5) return 'alert';
  return 'record';
}

export function decide(alert) {
  const description = descriptionOf(alert);
  const matches = [
    { name: PATTERNS[0].name, confidence: rapidSameSourceConfidence(alert, description) },
    { name: PATTERNS[1].name, confidence: samePasswordAcrossAccountsConfidence(alert, description) },
  ];
  const best = matches.reduce((current, candidate) => (
    candidate.confidence > current.confidence ? candidate : current
  ));
  const confidence = best.confidence;

  return {
    action: actionFor(confidence),
    confidence,
    reason: confidence > 0 ? best.name : 'no_matching_pattern',
  };
}
