import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deploymentIdentity } from '../scripts/deployment-identity.mjs';
import { runAttackChecks } from '../src/attack-check.mjs';

const config = {
  step: 1,
  judgeIssuer: 'https://aleph-judge-production.up.railway.app/defense/judge',
  sampleMarker: 'SAMPLE_NOTE_1',
  publicAppUrl: 'https://student-defense.vercel.app',
};
const env = {
  VERCEL_GIT_PROVIDER: 'github',
  VERCEL_GIT_REPO_OWNER: 'Student-A',
  VERCEL_GIT_REPO_SLUG: 'aleph-defense',
  VERCEL_GIT_COMMIT_SHA: 'a'.repeat(40),
  VERCEL_URL: 'student-defense-123.vercel.app',
};

test('build identity uses Vercel Git and deployment metadata', () => {
  assert.deepEqual(deploymentIdentity(env, config), {
    schema: 'aleph.defense.deployment.v1',
    step: 1,
    repoUrl: 'https://github.com/student-a/aleph-defense',
    commit: 'a'.repeat(40),
    publicAppUrl: config.publicAppUrl,
    judgeIssuer: config.judgeIssuer,
  });
  assert.throws(() => deploymentIdentity({ ...env, VERCEL_GIT_PROVIDER: undefined }, config));
  assert.throws(() => deploymentIdentity({ ...env, VERCEL_GIT_COMMIT_SHA: 'short' }, config));
  assert.equal(deploymentIdentity({ ...env, VERCEL_URL: 'protected-deployment.vercel.app' }, config).publicAppUrl,
    config.publicAppUrl);
  assert.throws(() => deploymentIdentity(env, { ...config, publicAppUrl: 'http://student-defense.vercel.app' }));
});

test('first attack check reads public data.json without credentials', async () => {
  const originalFetch = globalThis.fetch;
  let requestUrl;
  let options;
  try {
    globalThis.fetch = async (url, init) => {
      requestUrl = String(url);
      options = init;
      return new Response(JSON.stringify({ sampleMarker: 'SAMPLE_NOTE_1', notes: [{ title: '가상' }] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    };
    const [result] = await runAttackChecks(config);
    assert.equal(requestUrl, 'https://student-defense.vercel.app/data.json');
    assert.equal(options.redirect, 'error');
    assert.match(result.observed, /확인 표시가 보임/u);
    globalThis.fetch = async () => new Response('<html>not the data</html>', { status: 200 });
    const [failed] = await runAttackChecks(config);
    assert.match(failed.observed, /보이지 않음/u);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('12단계 자기 점검은 실제 조회 응답과 미실행을 구분한다', async () => {
  const originalFetch = globalThis.fetch;
  const originalInfo = console.info;
  const logs = [];
  const paths = [];
  try {
    console.info = line => logs.push(JSON.parse(line));
    globalThis.fetch = async (url, options) => {
      paths.push(url.pathname);
      assert.equal(options.redirect, 'error');
      assert.equal(options.headers, undefined);
      if (url.pathname === '/data.json') return Response.json({ notes: [] });
      return Response.json({ error: 'AUTHENTICATION_REQUIRED' }, { status: 401 });
    };
    const attempts = await runAttackChecks({ ...config, step: 12 });
    assert.deepEqual(paths, ['/data.json', '/api/notes', '/api/device-approval', '/api/operations-summary']);
    assert.equal(attempts.length, 9);
    assert.ok(attempts.every(row => row.observed === 'not_run'));
    const selfCheck = logs[0];
    assert.equal(selfCheck.judgeRequestRecordsMatched, false);
    assert.match(selfCheck.attempts[3].observed, /HTTP 401/);
    assert.ok(selfCheck.attempts.slice(4).every(row => row.observed.startsWith('미실행:')));
  } finally { globalThis.fetch = originalFetch; console.info = originalInfo; }
});
