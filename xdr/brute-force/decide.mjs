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

const FAILURE_RE = /(?:실패|failure|failed|login\s+failure|authentication\s+failure)/iu;
const SUCCESS_RE = /(?:성공|success)/iu;
const SHORT_WINDOW_RE = /(?:짧은 시간|\d+\s*(?:분|minute|min)\s*(?:안|동안|within)?)/iu;
const REPEATED_FAILURE_RE = /(?:연속|이어졌|쌓였|반복|같은 간격|repeated|consecutive)/iu;
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

function hasMultipleAccounts(alert, description) {
  const accounts = alert?.data?.accounts;
  if (Array.isArray(accounts)) return accounts.length > 1;
  if (typeof accounts === 'string' && accounts.trim()) {
    return accounts.split(/[,;|\s]+/u).filter(Boolean).length > 1;
  }
  return MULTIPLE_ACCOUNTS_RE.test(description);
}

function rapidSameSourceConfidence(alert, description) {
  if (!hasSourceAddress(alert) || !FAILURE_RE.test(description)) return 0;

  const count = failureCountOf(alert);
  const shortWindow = SHORT_WINDOW_RE.test(description);
  const repeated = REPEATED_FAILURE_RE.test(description) || count >= 3;
  if (count >= 10 && repeated) return 0.95;
  if (shortWindow && repeated && !SUCCESS_RE.test(description)) return 0.65;
  if (count >= 3) return 0.65;
  return 0;
}

function samePasswordAcrossAccountsConfidence(alert, description) {
  if (!hasSourceAddress(alert) || !SAME_PASSWORD_RE.test(description)) return 0;
  return hasMultipleAccounts(alert, description) ? 0.95 : 0;
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
