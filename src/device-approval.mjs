import { randomUUID } from 'node:crypto';
import { DEVICE_COOKIE, getCookie, setDeviceCookie } from './auth-session.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const DEVICE_STATUSES = new Set(['pending', 'approved', 'revoked']);

function normalizedStatus(row) {
  return DEVICE_STATUSES.has(row?.status) ? row.status : 'unregistered';
}

function approvalResult(row) {
  const status = normalizedStatus(row);
  return { approved: status === 'approved', status };
}

export function getOrCreateDeviceId(request, response) {
  const existing = getCookie(request, DEVICE_COOKIE);
  if (UUID.test(existing)) return existing;
  const deviceId = randomUUID();
  setDeviceCookie(response, deviceId);
  return deviceId;
}

export async function readDeviceApproval(supabase, ownerId, deviceId) {
  const { data, error } = await supabase
    .from('vault_devices')
    .select('status')
    .eq('owner_id', ownerId)
    .eq('device_id', deviceId)
    .maybeSingle();
  if (error) throw error;
  return approvalResult(data);
}

export async function requestDeviceApproval(supabase, ownerId, deviceId) {
  const current = await readDeviceApproval(supabase, ownerId, deviceId);
  if (current.status !== 'unregistered') return current;

  const { data, error } = await supabase
    .from('vault_devices')
    .insert({ owner_id: ownerId, device_id: deviceId, status: 'pending' })
    .select('status')
    .maybeSingle();
  if (error) throw error;
  return approvalResult(data);
}

export async function requireApprovedDevice(request, response, context) {
  const deviceId = getOrCreateDeviceId(request, response);
  try {
    const result = await readDeviceApproval(context.supabase, context.principal.userId, deviceId);
    if (!result.approved) {
      response.status(403).json({ error: 'DEVICE_NOT_APPROVED', status: result.status });
      return false;
    }
    return true;
  } catch {
    response.status(502).json({ error: 'DEVICE_REGISTRY_UNAVAILABLE' });
    return false;
  }
}
