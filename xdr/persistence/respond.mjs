import { appendFile } from 'node:fs/promises';
import { isIP } from 'node:net';
import { decide } from './decide.mjs';
import { decide as decideZtna } from '../../src/decider.mjs';

const LOG_URL = new URL('../alerts.log', import.meta.url);
const RULES = new Map();
const EVIDENCE_ID = /^ps-\d{2,6}$/u;

function currentTime(value = Date.now()) {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) throw new TypeError('현재 시각 형식이 올바르지 않습니다.');
  return time;
}

// Call this additional check with a trusted inspected event, before the existing
// ZTNA rules. Matching the source alone must never deny an ordinary request.
export function matchingDenyRule(alert, options = {}) {
  const now = currentTime(options.now);
  for (const [id, rule] of RULES) {
    if (Date.parse(rule.expiresAt) <= now) RULES.delete(id);
  }
  const decision = decide(alert);
  if (decision.action !== 'block' || decision.confidence < 0.85) return null;
  const source = alert?.data?.srcip;
  for (const rule of RULES.values()) {
    if (rule.match.sourceAddress === source
        && decision.reason.split(' + ').some((name) => rule.match.patternNames.includes(name))) {
      return structuredClone(rule);
    }
  }
  return null;
}

// Local composition: the inspected event is a separate trusted input, never a
// new field on the official ZTNA request. This envelope is not an engine response.
export async function checkAccess(request, inspectedAlert, options = {}) {
  const ztna = await decideZtna(request);
  // Always preserve a denial or step-up from the existing policy.
  if (ztna.decision !== 'allow') {
    return { decision: ztna.decision, ztna, xdr: null, rule: null };
  }
  // No inspection must not be represented as a successful XDR check.
  if (!inspectedAlert || typeof inspectedAlert !== 'object' || Array.isArray(inspectedAlert)) {
    return { decision: 'deny', ztna, xdr: null, rule: null, error: 'INSPECTION_REQUIRED' };
  }
  const xdr = await respond(inspectedAlert, decide(inspectedAlert), options);
  const rule = matchingDenyRule(inspectedAlert, options);
  const denied = xdr.decision.action === 'block';
  // Even missing rule identifiers cannot let a clear current attack through.
  return { decision: denied ? 'deny' : 'allow', ztna, xdr, rule };
}

export async function respond(alert, suppliedDecision = decide(alert), options = {}) {
  const decision = decide(alert);
  const unchanged = suppliedDecision?.action === decision.action
    && suppliedDecision?.confidence === decision.confidence
    && suppliedDecision?.reason === decision.reason;
  const empty = { applied: false, decision, rule: null, logged: false, externalApplied: false };
  if (!unchanged || decision.action === 'record' || !EVIDENCE_ID.test(alert?.id ?? '')) return empty;

  const now = currentTime(options.now);
  let rule = null;
  if (decision.action === 'block' && decision.confidence >= 0.85) {
    const sourceAddress = alert?.data?.srcip;
    if (typeof sourceAddress !== 'string' || !isIP(sourceAddress)) return empty;
    const ttl = options.ttlSeconds ?? 900;
    if (!Number.isInteger(ttl) || ttl < 1 || ttl > 86400) {
      throw new TypeError('만료 시간은 1초 이상 1일 이하여야 합니다.');
    }
    rule = {
      ruleId: `xdr.persistence.${alert.id}`,
      decision: 'deny',
      match: {
        sourceAddress,
        patternNames: decision.reason.split(' + '),
        requiresFreshBlockDecision: true,
      },
      expiresAt: new Date(now + ttl * 1000).toISOString(),
      evidenceAlertId: alert.id,
      confidence: decision.confidence,
      reason: decision.reason,
    };
  }

  // The adapter must enforce the whole match, including a fresh payload check.
  if (options.installDenyRule !== undefined && typeof options.installDenyRule !== 'function') {
    throw new TypeError('거부 규칙 등록 연결은 함수여야 합니다.');
  }
  await appendFile(options.logPath ?? LOG_URL, `${JSON.stringify({
    type: rule ? 'ztna_deny_candidate' : 'persistence_alert',
    evidenceAlertId: alert.id,
    action: decision.action,
    confidence: decision.confidence,
    reason: decision.reason,
    ...(rule ? { expiresAt: rule.expiresAt } : {}),
  })}\n`, 'utf8');

  let externalApplied = false;
  if (rule) {
    if (options.installDenyRule) {
      // Only an explicit acknowledgement counts as external installation.
      externalApplied = await options.installDenyRule(structuredClone(rule)) === true;
    }
    RULES.set(rule.ruleId, rule);
  }
  return { applied: Boolean(rule), decision, rule: rule ? structuredClone(rule) : null, logged: true, externalApplied };
}
