// ALEPH SDP 엔진이 확인한 요청만 받는 학생 판정기 시작점입니다.
// 6단계부터 규칙을 하나씩 추가합니다. 등록된 기기만 자료실 읽기를 허용합니다.
// 요청 본문의 userId, role, 기기 키, 토큰을 별도로 믿거나 저장하지 마세요.
export const RULE_IDS = Object.freeze([
  'device_registered',
  'signals_source_valid',
  'step_up_required',
]);

const signalSources = new Set(['none', 'judge_fixture']);

function hasEngineSignals(request) {
  const signals = request?.signals;
  if (!signals || typeof signals !== 'object' || Array.isArray(signals)) return false;
  if (!signalSources.has(signals.source)) return false;
  if (typeof signals.region !== 'string' || !signals.region.trim()) return false;
  if (typeof signals.network !== 'string' || !signals.network.trim()) return false;
  if (!Number.isInteger(signals.hour) || signals.hour < 0 || signals.hour > 23) return false;

  return Array.isArray(request.recentEvents)
    && request.recentEvents.every((event) => event && typeof event === 'object'
      && typeof event.kind === 'string' && event.kind.trim()
      && Number.isInteger(event.ageSeconds) && event.ageSeconds >= 0
      && Number.isInteger(event.count) && event.count >= 0);
}

function hasCompoundAnomaly(request) {
  const { signals, recentEvents } = request;
  const unusualHour = signals.hour < 6 || signals.hour >= 22;
  const unfamiliarNetwork = signals.network === 'unusual';
  const burstRead = recentEvents.some((event) => event.kind === 'risk_signal' && event.count >= 10);
  return unusualHour && unfamiliarNetwork && burstRead;
}

function hasRecentStepUp(request) {
  const stepUp = request.stepUp;
  return stepUp?.verified === true
    && Number.isInteger(stepUp.authAgeSeconds)
    && stepUp.authAgeSeconds >= 0
    && stepUp.authAgeSeconds <= 900;
}

export async function decide(request) {
  if (!hasEngineSignals(request)) {
    return {
      schema: 'aleph.decision.v1',
      requestId: request?.requestId,
      decision: 'deny',
      reasonCode: 'signals_unverified',
      ruleIds: [RULE_IDS[1]],
    };
  }

  const deviceRegistered = request.deviceRegistered === true;
  if (!deviceRegistered) {
    return {
      schema: 'aleph.decision.v1',
      requestId: request.requestId,
      decision: 'deny',
      reasonCode: 'device_not_registered',
      ruleIds: [RULE_IDS[0]],
    };
  }

  if (hasCompoundAnomaly(request) && !hasRecentStepUp(request)) {
    return {
      schema: 'aleph.decision.v1',
      requestId: request.requestId,
      decision: 'step_up',
      reasonCode: 'step_up_required',
      ruleIds: [RULE_IDS[0], RULE_IDS[2]],
    };
  }

  return {
    schema: 'aleph.decision.v1',
    requestId: request.requestId,
    decision: 'allow',
    reasonCode: 'approved',
    ruleIds: [RULE_IDS[0]],
  };
}
