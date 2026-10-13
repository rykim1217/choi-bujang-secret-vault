// ALEPH SDP 엔진이 확인한 요청만 받는 학생 판정기입니다.
// 요청 본문의 role, 기기 키, 토큰을 별도로 믿거나 저장하지 마세요.
import { createHash } from 'node:crypto';
import { identifyResource } from './resource-policy.mjs';

export const RULE_IDS = Object.freeze([
  'device_registered',
  'signals_source_valid',
  'step_up_required',
  'resource_path_exact',
  'resource_zone',
]);

const signalSources = new Set(['none', 'judge_fixture']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const DEVICE_ID = /^[0-9a-f]{16}$/u;
const SHA256 = /^[0-9a-f]{64}$/u;

function hasEngineRequest(request) {
  if (!request || typeof request !== 'object' || Array.isArray(request)
      || request.schema !== 'aleph.decision.v1'
      || !UUID.test(request.requestId)) return false;

  const identifiers = ['classId', 'projectId', 'subjectId', 'service', 'method', 'path', 'route'];
  if (identifiers.some((key) => typeof request[key] !== 'string' || !request[key].trim())) return false;
  if (!DEVICE_ID.test(request.deviceId) || request.method !== request.method.toUpperCase()) return false;
  if (!Number.isInteger(request.queryLength) || request.queryLength < 0
      || !SHA256.test(request.querySha256)) return false;
  const emptyQueryHash = createHash('sha256').update('').digest('hex');
  if ((request.queryLength === 0 && request.querySha256 !== emptyQueryHash)
      || (request.queryLength > 0 && request.querySha256 === emptyQueryHash)) return false;
  if (!Number.isInteger(request.policyRevision) || request.policyRevision < 1) return false;

  return true;
}

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
  if (!hasEngineRequest(request)) {
    return {
      schema: 'aleph.decision.v1',
      requestId: request?.requestId,
      decision: 'deny',
      reasonCode: 'request_unverified',
      ruleIds: [RULE_IDS[3]],
    };
  }

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

  if (request.queryLength !== 0) {
    return {
      schema: 'aleph.decision.v1',
      requestId: request.requestId,
      decision: 'deny',
      reasonCode: 'query_not_allowed',
      ruleIds: [RULE_IDS[3]],
    };
  }

  const resourceId = identifyResource(request);
  if (!resourceId) {
    return {
      schema: 'aleph.decision.v1',
      requestId: request.requestId,
      decision: 'deny',
      reasonCode: 'resource_path_unrecognized',
      ruleIds: [RULE_IDS[3]],
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
      ruleIds: [RULE_IDS[0], RULE_IDS[4]],
  };
}
