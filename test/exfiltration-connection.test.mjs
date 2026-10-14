import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { readFile, unlink } from 'node:fs/promises';
import { test } from 'node:test';
import { decide } from '../src/decider.mjs';
import { decide as decideXdr } from '../xdr/exfiltration/decide.mjs';
import { checkAccess, matchingDenyRule, respond } from '../xdr/exfiltration/respond.mjs';

function request(overrides = {}) {
  return {
    schema: 'aleph.decision.v1', requestId: randomUUID(),
    classId: 'class_fixture', projectId: 'project_fixture', subjectId: 'learner_fixture',
    deviceId: 'abcdef0123456789', service: 'notes', method: 'GET',
    path: '/api/notes/opaque-note-7', route: 'GET /api/notes/:id',
    queryLength: 0, querySha256: createHash('sha256').update('').digest('hex'),
    at: '2026-10-14T00:00:00Z', policyRevision: 0, deviceRegistered: true,
    stepUp: { verified: false, authAgeSeconds: null }, recentEvents: [],
    signals: { source: 'none', region: 'unknown', network: 'unknown', hour: 14 },
    ...overrides,
  };
}

test('기존 ZTNA 허용 뒤 XDR 추가 검사: 공격만 거부하고 정상·애매한 경보는 기존 허용 유지', async () => {
  const fixture = JSON.parse(await readFile(new URL('../xdr/fixtures/exfiltration.json', import.meta.url), 'utf8'));
  const logPath = new URL(`../xdr/exfiltration/.connection-${randomUUID()}.log`, import.meta.url);
  const options = { now: '2026-10-14T00:00:00Z', logPath };
  try {
    for (const alert of fixture.alerts) {
      const input = request();
      const original = structuredClone(input);
      const result = await checkAccess(input, alert, options);
      assert.deepEqual(input, original);
      assert.deepEqual(result.ztna, await decide(input));
      assert.equal(result.decision, result.xdr.decision.action === 'block' ? 'deny' : 'allow');
      if (Number(alert.id.slice(3)) <= 10) assert.equal(result.decision, 'deny');
      if (Number(alert.id.slice(3)) >= 11 && Number(alert.id.slice(3)) <= 20) {
        assert.equal(result.xdr.decision.action, 'alert');
        assert.equal(result.xdr.rule, null);
        assert.equal(result.xdr.logged, true);
      }
      if (Number(alert.id.slice(3)) >= 21) assert.equal(result.decision, 'allow');
    }
    const normal = { ...fixture.alerts[20], data: { ...fixture.alerts[20].data, srcip: fixture.alerts[0].data.srcip } };
    assert.equal((await checkAccess(request(), normal, options)).decision, 'allow');
    assert.equal(matchingDenyRule(fixture.alerts[0], {now:'2026-10-14T00:15:00Z'}), null);
    const deniedInput = request({deviceRegistered:false});
    const denied = await checkAccess(deniedInput, normal, options);
    assert.equal(denied.decision, 'deny');
    assert.deepEqual(denied.ztna, await decide(deniedInput));
    const stepUpInput = request({
      signals: {source:'judge_fixture',region:'unknown',network:'unusual',hour:23},
      recentEvents:[{kind:'risk_signal',ageSeconds:0,count:10}],
    });
    assert.equal((await checkAccess(stepUpInput, normal, options)).decision, 'step_up');
    assert.equal((await checkAccess(request(), null, options)).error, 'INSPECTION_REQUIRED');
    const lines = (await readFile(logPath,'utf8')).trim().split('\n');
    assert.equal(lines.length,20);
    assert.equal(lines.map(JSON.parse).filter(row => row.type === 'exfiltration_alert').length,10);
    assert.ok(lines.every(line => !line.includes('srcip') && !line.includes('srcuser') && !line.includes('관리자 명령')));
  } finally { await unlink(logPath).catch(error => { if (error.code !== 'ENOENT') throw error; }); }
});

test('약한 반출 신호는 알림이며 정상 이벤트는 기록한다', async () => {
  const fixture = JSON.parse(await readFile(new URL('../xdr/fixtures/exfiltration.json', import.meta.url), 'utf8'));
  for (const alert of fixture.alerts.slice(10,20)) {
    assert.equal(decideXdr({...alert,id:'different-id'}).action,'alert');
  }
  for (const alert of fixture.alerts.slice(20)) assert.equal(decideXdr(alert).action,'record');
  assert.equal(decideXdr({data:{path:'C:\\lab\\notes.txt'}}).action,'record');
  assert.equal(decideXdr({rule:{mitre:['T1048'],description:'정상 상태 확인'},data:{}}).action,'record');
});

test('독립 모듈·입력 보존·패턴 상수·반환 경계 확인', async () => {
  const source = await readFile(new URL('../xdr/exfiltration/decide.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\bimport\b|\brequire\s*\(|\bfetch\s*\(|\bprocess\b/);
  const isolated = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  const fixture = JSON.parse(await readFile(new URL('../xdr/fixtures/exfiltration.json', import.meta.url), 'utf8'));
  const patterns = JSON.parse(await readFile(new URL('../xdr/exfiltration/patterns.json', import.meta.url), 'utf8'));
  const embedded = source.match(/const PATTERNS = Object\.freeze\(([\s\S]*?)\);/u);
  assert.deepEqual(JSON.parse(embedded[1]), patterns);
  for (const alert of fixture.alerts) {
    const before = structuredClone(alert);
    const result = isolated.decide(alert);
    assert.deepEqual(alert, before);
    assert.deepEqual(Object.keys(result).sort(), ['action', 'confidence', 'reason']);
    assert.equal(result.action, result.confidence >= 0.85 ? 'block' : result.confidence >= 0.5 ? 'alert' : 'record');
  }
  assert.equal(isolated.decide(null).action, 'record');
});

test('위조 결과 거부·외부 등록 확인·만료·정상 규칙 미생성', async () => {
  const fixture = JSON.parse(await readFile(new URL('../xdr/fixtures/exfiltration.json', import.meta.url), 'utf8'));
  const logPath = new URL(`../xdr/exfiltration/.response-${randomUUID()}.log`, import.meta.url);
  const installed = [];
  const options = { now: '2026-10-14T01:00:00Z', logPath, installDenyRule: rule => { installed.push(rule); return true; } };
  try {
    const forged = await respond(fixture.alerts[20], { action:'block', confidence:1, reason:'forged' }, options);
    assert.equal(forged.applied, false);
    const blocked = await respond(fixture.alerts[0], decideXdr(fixture.alerts[0]), options);
    assert.equal(blocked.externalApplied, true);
    assert.equal(installed.length, 1);
    assert.equal(blocked.rule.evidenceAlertId, fixture.alerts[0].id);
    assert.equal(blocked.rule.match.destinationAddress, fixture.alerts[0].data.dstip);
    const otherDestination = structuredClone(fixture.alerts[0]);
    otherDestination.data.dstip = '192.0.2.99';
    assert.equal(matchingDenyRule(otherDestination, options), null);
    assert.equal(blocked.rule.expiresAt, '2026-10-14T01:15:00.000Z');
    assert.ok(matchingDenyRule(fixture.alerts[0], options));
    assert.equal(matchingDenyRule(fixture.alerts[0], {now:blocked.rule.expiresAt}), null);
    for (const normal of fixture.alerts.slice(20)) assert.equal((await respond(normal, decideXdr(normal), options)).rule, null);
    assert.equal(installed.length, 1);
  } finally { await unlink(logPath).catch(error => { if (error.code !== 'ENOENT') throw error; }); }
});
