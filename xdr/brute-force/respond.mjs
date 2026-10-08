import { appendFile } from 'node:fs/promises';

import { decide } from './decide.mjs';

const ALERT_LOG_URL = new URL('../alerts.log', import.meta.url);
const DEFAULT_TTL_SECONDS = 15 * 60;
const BLOCK_THRESHOLD = 0.85;
const ALERT_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/u;

function validDecision(value) {
  return value
    && value.action === 'block'
    && typeof value.confidence === 'number'
    && value.confidence >= BLOCK_THRESHOLD
    && typeof value.reason === 'string'
    && value.reason.length > 0;
}

function validAlert(alert) {
  const alertId = typeof alert?.id === 'string' ? alert.id : '';
  const sourceAddress = typeof alert?.data?.srcip === 'string' ? alert.data.srcip.trim() : '';
  const account = typeof alert?.data?.srcuser === 'string' ? alert.data.srcuser.trim() : '';
  return ALERT_ID_RE.test(alertId) && sourceAddress.length > 0 && account.length > 0;
}

function expiryFor(now, ttlSeconds) {
  const current = now instanceof Date ? now : new Date(now);
  const ttl = ttlSeconds ?? DEFAULT_TTL_SECONDS;
  if (Number.isNaN(current.getTime()) || !Number.isInteger(ttl) || ttl < 1 || ttl > 24 * 60 * 60) {
    throw new TypeError('유효한 현재 시각과 1일 이내 만료 시간이 필요합니다.');
  }
  return new Date(current.getTime() + ttl * 1000).toISOString();
}

function denyRuleFor(alert, decision, expiresAt) {
  const alertId = alert.id;
  return {
    ruleId: `xdr.brute_force.${alertId}`,
    decision: 'deny',
    match: {
      sourceAddress: alert.data.srcip.trim(),
      account: alert.data.srcuser.trim(),
    },
    expiresAt,
    evidenceAlertId: alertId,
    reason: decision.reason,
  };
}

function notificationFor(rule) {
  return `${JSON.stringify({
    type: 'ztna_deny_candidate',
    ruleId: rule.ruleId,
    evidenceAlertId: rule.evidenceAlertId,
    expiresAt: rule.expiresAt,
    reason: rule.reason,
  })}\n`;
}

export async function respond(alert, suppliedDecision = decide(alert), options = {}) {
  const decision = decide(alert);
  const sameAsDecide = suppliedDecision?.action === decision.action
    && suppliedDecision?.confidence === decision.confidence
    && suppliedDecision?.reason === decision.reason;

  if (!sameAsDecide || !validDecision(decision) || !validAlert(alert)) {
    return { applied: false, decision, rule: null, logged: false };
  }

  const expiresAt = expiryFor(options.now, options.ttlSeconds);
  const rule = denyRuleFor(alert, decision, expiresAt);
  const logPath = options.logPath ?? ALERT_LOG_URL;
  await appendFile(logPath, notificationFor(rule), 'utf8');
  return { applied: true, decision, rule, logged: true };
}
