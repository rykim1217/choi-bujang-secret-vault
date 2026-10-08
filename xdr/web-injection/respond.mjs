import { appendFile } from 'node:fs/promises';

import { decide } from './decide.mjs';

const ALERT_LOG_URL = new URL('../alerts.log', import.meta.url);
const DEFAULT_TTL_SECONDS = 15 * 60;
const BLOCK_THRESHOLD = 0.85;
const ALERT_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/u;

function validDecision(value) {
  return value
    && ['block', 'alert', 'record'].includes(value.action)
    && typeof value.confidence === 'number'
    && Number.isFinite(value.confidence)
    && value.confidence >= 0
    && value.confidence <= 1
    && typeof value.reason === 'string'
    && value.reason.length > 0;
}

function validAlertId(alert) {
  return typeof alert?.id === 'string' && ALERT_ID_RE.test(alert.id);
}

function sourceAddressOf(alert) {
  const sourceAddress = alert?.data?.srcip;
  return typeof sourceAddress === 'string' && sourceAddress.trim().length > 0
    ? sourceAddress.trim()
    : '';
}

function requestPathOf(alert) {
  const requestUrl = alert?.data?.url ?? alert?.url;
  if (typeof requestUrl !== 'string' || requestUrl.trim().length === 0) return '';
  try {
    return new URL(requestUrl, 'https://xdr.invalid').pathname || '/';
  } catch {
    return requestUrl.split(/[?#]/u)[0] || '/';
  }
}

function methodOf(alert) {
  const method = alert?.data?.method ?? alert?.method;
  return typeof method === 'string' && method.trim().length > 0
    ? method.trim().toUpperCase()
    : '';
}

function validBlockAlert(alert) {
  return validAlertId(alert) && sourceAddressOf(alert).length > 0 && requestPathOf(alert).length > 0;
}

function expiryFor(now, ttlSeconds) {
  const current = now instanceof Date ? now : new Date(now ?? Date.now());
  const ttl = ttlSeconds ?? DEFAULT_TTL_SECONDS;
  if (Number.isNaN(current.getTime()) || !Number.isInteger(ttl) || ttl < 1 || ttl > 24 * 60 * 60) {
    throw new TypeError('유효한 현재 시각과 1일 이내 만료 시간이 필요합니다.');
  }
  return new Date(current.getTime() + ttl * 1000).toISOString();
}

function denyRuleFor(alert, decision, expiresAt) {
  const match = {
    sourceAddress: sourceAddressOf(alert),
    requestPath: requestPathOf(alert),
  };
  const method = methodOf(alert);
  if (method) match.method = method;

  return {
    ruleId: `xdr.web_injection.${alert.id}`,
    decision: 'deny',
    match,
    expiresAt,
    evidenceAlertId: alert.id,
    confidence: decision.confidence,
    reason: decision.reason,
  };
}

function notificationForRule(rule) {
  return `${JSON.stringify({
    type: 'ztna_deny_candidate',
    ruleId: rule.ruleId,
    evidenceAlertId: rule.evidenceAlertId,
    expiresAt: rule.expiresAt,
    confidence: rule.confidence,
    reason: rule.reason,
  })}\n`;
}

function notificationForAlert(alert, decision) {
  return `${JSON.stringify({
    type: 'web_injection_alert',
    evidenceAlertId: alert.id,
    confidence: decision.confidence,
    reason: decision.reason,
  })}\n`;
}

function sameDecision(left, right) {
  return left?.action === right?.action
    && left?.confidence === right?.confidence
    && left?.reason === right?.reason;
}

export async function respond(alert, suppliedDecision = decide(alert), options = {}) {
  const decision = decide(alert);
  const logPath = options.logPath ?? ALERT_LOG_URL;

  if (!sameDecision(suppliedDecision, decision) || !validDecision(decision)) {
    return { applied: false, decision, rule: null, logged: false };
  }

  if (decision.action === 'record') {
    return { applied: false, decision, rule: null, logged: false };
  }

  if (decision.action === 'alert') {
    if (!validAlertId(alert)) {
      return { applied: false, decision, rule: null, logged: false };
    }
    await appendFile(logPath, notificationForAlert(alert, decision), 'utf8');
    return { applied: false, decision, rule: null, logged: true };
  }

  if (decision.confidence < BLOCK_THRESHOLD || !validBlockAlert(alert)) {
    return { applied: false, decision, rule: null, logged: false };
  }

  const expiresAt = expiryFor(options.now, options.ttlSeconds);
  const rule = denyRuleFor(alert, decision, expiresAt);
  await appendFile(logPath, notificationForRule(rule), 'utf8');
  return { applied: true, decision, rule, logged: true };
}
