import { getAuthenticatedContext, requireSameOrigin } from './notes.js';
import {
  getOrCreateDeviceId,
  readDeviceApproval,
  requestDeviceApproval,
} from '../src/device-approval.mjs';

function responseBody(result) {
  return { approved: result.approved, status: result.status };
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');

  if (!['GET', 'POST'].includes(request.method)) {
    response.setHeader('Allow', 'GET, POST');
    return response.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }
  if (request.method === 'POST' && !requireSameOrigin(request, response)) return;

  const context = await getAuthenticatedContext(request, response);
  if (!context) return;

  const deviceId = getOrCreateDeviceId(request, response);
  try {
    const result = request.method === 'POST'
      ? await requestDeviceApproval(context.supabase, context.principal.userId, deviceId)
      : await readDeviceApproval(context.supabase, context.principal.userId, deviceId);
    return response.status(200).json(responseBody(result));
  } catch {
    return response.status(502).json({ error: 'DEVICE_REGISTRY_UNAVAILABLE' });
  }
}
