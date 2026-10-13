import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { decide } from '../src/decider.mjs';
import { storedOwnerMatches } from '../src/resource-access.mjs';
import { identifyResource, RESOURCE_IDS } from '../src/resource-policy.mjs';

const emptyHash = createHash('sha256').update('').digest('hex');
const queryHash = createHash('sha256').update('page=1').digest('hex');

function request(overrides = {}) {
  return {
    schema: 'aleph.decision.v1',
    requestId: randomUUID(),
    classId: 'class_fixture',
    projectId: 'project_fixture',
    subjectId: 'learner_fixture',
    deviceId: 'abcdef0123456789',
    service: 'notes',
    method: 'GET',
    path: '/notes/opaque-note-7',
    route: 'GET /notes/:id',
    queryLength: 6,
    querySha256: queryHash,
    at: '2020-01-01T00:00:00.000Z',
    policyRevision: 0,
    deviceRegistered: true,
    stepUp: { verified: false, authAgeSeconds: null },
    recentEvents: [],
    signals: { source: 'none', region: 'unknown', network: 'unknown', hour: 14 },
    ...overrides,
  };
}

test('계약 예시와 실제 API 접두사의 메모 GET은 notes 구역으로 허용된다', async () => {
  assert.equal(identifyResource({
    service: 'notes', method: 'GET', path: '/notes/opaque-note-7',
    route: 'GET /notes/:id',
  }), RESOURCE_IDS.notes);
  assert.equal(identifyResource({
    service: 'notes', method: 'GET', path: '/api/notes/opaque-note-7',
    route: 'GET /api/notes/:id',
  }), RESOURCE_IDS.notes);
  const response = await decide(request({
    path: '/notes/opaque-note-7', route: 'GET /notes/:id',
  }));
  assert.equal(response.decision, 'allow');
  assert.equal(response.reasonCode, 'approved');
  const updateResponse = await decide(request({
    method: 'PUT', path: '/api/notes/opaque-note-7', route: 'PUT /api/notes/:id',
  }));
  assert.equal(updateResponse.decision, 'allow');
});

test('정상 목록 GET과 API 접두사도 경로 구조가 맞으면 허용된다', () => {
  assert.equal(identifyResource({
    service: 'notes', method: 'GET', path: '/api/notes', route: 'GET /api/notes',
  }), RESOURCE_IDS.notes);
  assert.equal(identifyResource({
    service: 'notes', method: 'GET', path: '/notes/opaque-note-7', route: 'GET /notes/:id',
  }), RESOURCE_IDS.notes);
});

test('export·중첩·알 수 없는 구역은 거부한다', async () => {
  const blocked = [
    { path: '/notes/export', route: 'GET /notes/export' },
    { path: '/notes/opaque-note-7/export', route: 'GET /notes/:id/export' },
    { path: '/v2/notes/opaque-note-7', route: 'GET /v2/notes/:id' },
    { path: '/v2/other/opaque-note-7', route: 'GET /v2/other/:id' },
  ];
  for (const item of blocked) {
    assert.equal(identifyResource({ service: 'notes', method: 'GET', ...item }), null);
    const response = await decide(request(item));
    assert.equal(response.decision, 'deny');
    assert.equal(response.reasonCode, 'resource_path_unrecognized');
  }
});

test('기기 등록과 7단계 추가 확인 규칙은 유지된다', async () => {
  const unregistered = await decide(request({ deviceRegistered: false }));
  assert.equal(unregistered.reasonCode, 'device_not_registered');
  const suspicious = await decide(request({
    signals: { source: 'none', region: 'unknown', network: 'unusual', hour: 3 },
    recentEvents: [{ kind: 'risk_signal', ageSeconds: 60, count: 20 }],
    queryLength: 0,
    querySha256: emptyHash,
  }));
  assert.equal(suspicious.decision, 'step_up');
});

test('자료 API는 저장된 소유자·강사와 검증된 주체가 일치할 때만 허용한다', () => {
  const ownerA = 'user-a';
  const ownerB = 'user-b';
  assert.equal(storedOwnerMatches({ owner_id: ownerA }, 'owner_id', ownerA), true);
  assert.equal(storedOwnerMatches({ owner_id: ownerB }, 'owner_id', ownerA), false);
  assert.equal(storedOwnerMatches({ instructor_id: ownerB }, 'instructor_id', ownerA), false);
  assert.equal(storedOwnerMatches({ instructor_id: ownerA }, 'instructor_id', ownerA), true);
});
