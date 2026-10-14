import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createOperationsHandler } from '../api/operations-summary.js';

function response() {
  return { headers: {}, setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
}

test('인증 없이 작전실 기록을 조회하지 못한다', async () => {
  let queried = false;
  const handler = createOperationsHandler({ authenticate: async (_, res) => {
    res.status(401).json({ error: 'AUTHENTICATION_REQUIRED' }); return null;
  }, readApproval: async () => { queried = true; } });
  const res = response();
  await handler({ method: 'GET' }, res);
  assert.equal(res.code, 401);
  assert.equal(queried, false);
});

test('현재 기기 실측만 노출하고 응답과 가린 기록이 일치한다', async () => {
  const logs = [];
  const handler = createOperationsHandler({
    authenticate: async () => ({ principal: { userId: 'private-user' }, supabase: {} }),
    readApproval: async () => ({ status: 'revoked', approved: false, content: 'private-note' }),
    log: (line) => logs.push(JSON.parse(line)),
  });
  const res = response();
  await handler({ method: 'GET', headers: {} }, res);
  assert.equal(res.code, 200);
  assert.equal(res.headers['Cache-Control'], 'no-store');
  assert.equal(res.body.device.status, 'revoked');
  for (const key of ['rules', 'detection', 'revocation', 'recovery']) {
    assert.equal(res.body[key].execution, 'not_run');
  }
  assert.equal(res.body.detection.eventCount, null);
  const { event, ...logged } = logs[0];
  assert.equal(event, 'operations_summary');
  assert.deepEqual(logged, res.body);
  assert.doesNotMatch(JSON.stringify(logs), /private-user|private-note|ownerId|contentSha256/);
});

test('등록부 오류는 성공 수치로 표시하지 않는다', async () => {
  const handler = createOperationsHandler({
    authenticate: async () => ({ principal: { userId: 'private-user' }, supabase: {} }),
    readApproval: async () => { throw new Error('private-error'); },
    log: () => assert.fail('오류 응답을 성공 기록으로 남기면 안 됩니다'),
  });
  const res = response();
  await handler({ method: 'GET', headers: {} }, res);
  assert.equal(res.code, 502);
  assert.deepEqual(res.body, { error: 'OPERATIONS_SUMMARY_UNAVAILABLE' });
});
