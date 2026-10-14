import assert from 'node:assert/strict';
import { test } from 'node:test';
import { plannedChecks, measureReadChecks } from '../src/operations-checks.mjs';

test('11단계 정상·금지 절차는 모두 미실행으로 시작한다', () => {
  const rows = plannedChecks();
  assert.equal(rows.length, 22);
  for (let step = 1; step <= 11; step++) {
    assert.deepEqual(rows.filter(row => row.step === step).map(row => row.kind), ['정상', '금지']);
  }
  assert.ok(rows.every(row => row.execution === 'not_run' && row.actual === null
    && row.requestId === null && row.checkedAt === null));
});

test('정상·무인증의 실제 상태를 분리하고 본문·인증값은 결과에 남기지 않는다', async () => {
  const sent = [];
  let cancelled = 0;
  const result = await measureReadChecks({ appUrl: 'https://vault.example',
    cookie: 'private-cookie', authorization: 'private-token', fetchImpl: async (url, options) => {
      sent.push(options);
      assert.equal(url.pathname, '/api/notes');
      assert.equal(options.redirect, 'error');
      return { status: options.headers.Cookie ? 200 : 401,
        headers: new Headers({ 'x-vercel-id': 'server-id' }),
        body: { cancel: async () => { cancelled++; } },
        json: () => assert.fail('메모 본문을 읽으면 안 됩니다') };
    } });
  assert.equal(cancelled, 2);
  assert.deepEqual(sent[1].headers, {});
  const observed = result.rows.filter(row => row.execution === 'observed');
  assert.equal(observed.length, 2);
  assert.ok(observed.every(row => row.matchesExpected && row.requestId && row.checkedAt));
  assert.equal(result.official41.execution, 'not_run');
  assert.equal(result.official41.passed, null);
  assert.doesNotMatch(JSON.stringify(result), /private-cookie|private-token/);
});

test('금지 요청이 200이면 기대 불일치, 전송 오류는 통과가 아니다', async () => {
  let call = 0;
  const result = await measureReadChecks({ appUrl: 'https://vault.example', fetchImpl: async () => {
    if (++call === 1) throw new Error('private-error');
    return { status: 200, headers: new Headers() };
  } });
  assert.equal(result.rows[4].execution, 'error');
  assert.equal(result.rows[4].matchesExpected, null);
  assert.equal(result.rows[5].matchesExpected, false);
  assert.doesNotMatch(JSON.stringify(result), /private-error/);
});
