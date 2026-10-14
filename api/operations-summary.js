import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { getAuthenticatedContext, requireSameOrigin } from './notes.js';
import { getRequestHeader } from '../src/auth-session.mjs';
import { measureReadChecks } from '../src/operations-checks.mjs';
import { getOrCreateDeviceId, readDeviceApproval } from '../src/device-approval.mjs';
import { operationsSummary } from '../src/operations-summary.mjs';
const config = JSON.parse(readFileSync(new URL('../aleph.config.json', import.meta.url), 'utf8'));

export function createOperationsHandler({ authenticate = getAuthenticatedContext,
  readApproval = readDeviceApproval, log = console.info } = {}) {
  return async function handler(request, response) {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    if (!['GET', 'POST'].includes(request.method)) {
      response.setHeader('Allow', 'GET, POST');
      return response.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    }
    if (request.method === 'POST' && !requireSameOrigin(request, response)) return;
    const context = await authenticate(request, response);
    if (!context) return;
    try {
      if (request.method === 'POST') {
        const app = new URL(config.publicAppUrl);
        if (app.protocol !== 'https:' || app.username || app.password || app.search || app.hash
          || app.pathname !== '/' || getRequestHeader(request, 'host') !== app.host) {
          return response.status(409).json({ error: 'CHECK_DEPLOYMENT_MISMATCH' });
        }
        const checks = await measureReadChecks({ appUrl: app,
          cookie: getRequestHeader(request, 'cookie'), authorization: getRequestHeader(request, 'authorization') });
        const result = { schema: 'aleph.operations.checks.v1', requestId: randomUUID(),
          checkedAt: new Date().toISOString(), checks };
        log(JSON.stringify({ event: 'operations_checks', ...result }));
        return response.status(200).json(result);
      }
      const deviceId = getOrCreateDeviceId(request, response);
      const device = await readApproval(context.supabase, context.principal.userId, deviceId);
      const summary = operationsSummary({ requestId: randomUUID(),
        checkedAt: new Date().toISOString(), deviceStatus: device.status });
      log(JSON.stringify({ event: 'operations_summary', ...summary }));
      return response.status(200).json(summary);
    } catch {
      return response.status(502).json({ error: 'OPERATIONS_SUMMARY_UNAVAILABLE' });
    }
  };
}

export default createOperationsHandler();
