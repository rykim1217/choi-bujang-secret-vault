import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  getOrCreateDeviceId,
  requireApprovedDevice,
  readDeviceApproval,
  requestDeviceApproval,
} from '../src/device-approval.mjs';

const OWNER_ID = '00000000-0000-4000-8000-000000000001';
const DEVICE_ID = '00000000-0000-4000-8000-000000000002';

function response() {
  return {
    headers: new Map(),
    setHeader(name, value) { this.headers.set(name, value); },
    getHeader(name) { return this.headers.get(name); },
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

function fakeSupabase(row = null) {
  let inserted;
  const table = {
    select() { return this; },
    eq() { return this; },
    maybeSingle() {
      return Promise.resolve({ data: inserted ? { status: inserted.status } : row, error: null });
    },
    insert(values) {
      inserted = values;
      return this;
    },
  };
  return {
    from(name) {
      assert.equal(name, 'vault_devices');
      return table;
    },
    get inserted() { return inserted; },
  };
}

test('기기 식별자는 HttpOnly 쿠키로만 발급하고 기존 쿠키를 재사용한다', () => {
  const firstResponse = response();
  const deviceId = getOrCreateDeviceId({ headers: {} }, firstResponse);
  assert.match(deviceId, /^[0-9a-f-]{36}$/u);
  assert.match(firstResponse.headers.get('Set-Cookie')[0], /vault_device_id=.*HttpOnly.*Secure/u);

  const secondResponse = response();
  const reused = getOrCreateDeviceId({ headers: { cookie: `vault_device_id=${deviceId}` } }, secondResponse);
  assert.equal(reused, deviceId);
  assert.equal(secondResponse.headers.has('Set-Cookie'), false);
});

test('등록부에 없는 기기는 승인되지 않는다', async () => {
  const result = await readDeviceApproval(fakeSupabase(), OWNER_ID, DEVICE_ID);
  assert.deepEqual(result, { approved: false, status: 'unregistered' });
});

test('승인 요청은 pending만 만들고 approved 상태를 덮어쓰지 않는다', async () => {
  const pendingSupabase = fakeSupabase();
  const pending = await requestDeviceApproval(pendingSupabase, OWNER_ID, DEVICE_ID);
  assert.deepEqual(pending, { approved: false, status: 'pending' });
  assert.deepEqual(pendingSupabase.inserted, {
    owner_id: OWNER_ID, device_id: DEVICE_ID, status: 'pending',
  });

  const approvedSupabase = fakeSupabase({ status: 'approved' });
  const approved = await requestDeviceApproval(approvedSupabase, OWNER_ID, DEVICE_ID);
  assert.deepEqual(approved, { approved: true, status: 'approved' });
  assert.equal(approvedSupabase.inserted, undefined);
});

test('승인 전 자료 API 게이트는 거부하고 승인된 등록부 상태만 통과시킨다', async () => {
  const deniedResponse = response();
  const denied = await requireApprovedDevice(
    { headers: {} },
    deniedResponse,
    { principal: { userId: OWNER_ID }, supabase: fakeSupabase() },
  );
  assert.equal(denied, false);
  assert.equal(deniedResponse.code, 403);
  assert.equal(deniedResponse.body.error, 'DEVICE_NOT_APPROVED');

  const allowedResponse = response();
  const allowed = await requireApprovedDevice(
    { headers: { cookie: `vault_device_id=${DEVICE_ID}` } },
    allowedResponse,
    { principal: { userId: OWNER_ID }, supabase: fakeSupabase({ status: 'approved' }) },
  );
  assert.equal(allowed, true);
  assert.equal(allowedResponse.code, undefined);
});
