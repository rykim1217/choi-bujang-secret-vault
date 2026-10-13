import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { decide } from '../src/decider.mjs';
import { storedOwnerMatches } from '../src/resource-access.mjs';
import { identifyResource, RESOURCE_IDS } from '../src/resource-policy.mjs';
import myNotesHandler from '../api/my/notes.js';

const emptyHash = createHash('sha256').update('').digest('hex');

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
    path: '/api/notes/opaque-note-7',
    route: 'GET /api/notes/:id',
    queryLength: 0,
    querySha256: emptyHash,
    at: '2020-01-01T00:00:00.000Z',
    policyRevision: 0,
    deviceRegistered: true,
    stepUp: { verified: false, authAgeSeconds: null },
    recentEvents: [],
    signals: { source: 'none', region: 'unknown', network: 'unknown', hour: 14 },
    ...overrides,
  };
}

test('자료 ID가 있는 개별 메모 GET만 notes 구역으로 허용된다', async () => {
  assert.equal(identifyResource({
    service: 'notes', method: 'GET', path: '/api/my/notes',
    route: 'GET /api/my/notes',
  }), null);
  assert.equal(identifyResource({
    service: 'notes', method: 'GET', path: '/api/notes',
    route: 'GET /api/notes',
  }), null);
  assert.equal(identifyResource({
    service: 'notes', method: 'GET', path: '/notes/opaque-note-7',
    route: 'GET /notes/:id',
  }), null);
  assert.equal(identifyResource({
    service: 'notes', method: 'GET', path: '/api/notes/opaque-note-7',
    route: 'GET /api/notes/:id',
  }), RESOURCE_IDS.notes);
  const response = await decide(request({
    path: '/api/notes/opaque-note-7', route: 'GET /api/notes/:id',
  }));
  assert.equal(response.decision, 'allow');
  assert.equal(response.reasonCode, 'approved');
  const listResponse = await decide(request({
    path: '/api/notes', route: 'GET /api/notes',
  }));
  assert.equal(listResponse.decision, 'deny');
  const updateResponse = await decide(request({
    method: 'PUT', path: '/api/notes/opaque-note-7', route: 'PUT /api/notes/:id',
  }));
  assert.equal(updateResponse.decision, 'deny');
  assert.equal(updateResponse.reasonCode, 'write_not_allowed');
});

test('메모 전체 목록과 화면 경로는 자료 구역으로 허용하지 않는다', () => {
  assert.equal(identifyResource({
    service: 'notes', method: 'GET', path: '/api/my/notes', route: 'GET /api/my/notes',
  }), null);
  assert.equal(identifyResource({
    service: 'notes', method: 'GET', path: '/notes/opaque-note-7', route: 'GET /notes/:id',
  }), null);
  assert.equal(identifyResource({
    service: 'notes', method: 'GET', path: '/api/notes/opaque-note-7', route: 'GET /api/notes/:id',
  }), RESOURCE_IDS.notes);
});

test('공지·강사 자료 구역은 식별되지만 판정기에서는 명시적으로 거부한다', async () => {
  assert.equal(identifyResource({
    service: 'announcements', method: 'GET', path: '/api/announcements/notice-7',
    route: 'GET /api/announcements/:id',
  }), RESOURCE_IDS.instructorAnnouncements);
  const response = await decide(request({
    service: 'announcements', path: '/api/announcements/notice-7',
    route: 'GET /api/announcements/:id',
  }));
  assert.equal(response.decision, 'deny');
  assert.equal(response.reasonCode, 'resource_path_unrecognized');
  assert.deepEqual(response.ruleIds, ['resource_zone']);
  const writeResponse = await decide(request({
    service: 'announcements', method: 'PUT', path: '/api/announcements/notice-7',
    route: 'PUT /api/announcements/:id',
  }));
  assert.equal(writeResponse.decision, 'deny');
  assert.equal(writeResponse.reasonCode, 'write_not_allowed');
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

test('소유권 증거가 없는 모든 쓰기와 쿼리 기능 선택은 거부한다', async () => {
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    const response = await decide(request({
      method,
      path: method === 'POST' ? '/api/notes' : '/api/notes/opaque-note-7',
      route: method === 'POST' ? 'POST /api/notes' : `${method} /api/notes/:id`,
    }));
    assert.equal(response.decision, 'deny');
    assert.equal(response.reasonCode, 'write_not_allowed');
  }
  const queryResponse = await decide(request({ queryLength: 1 }));
  assert.equal(queryResponse.decision, 'deny');
});

test('자료 API는 저장된 소유자·강사와 검증된 주체가 일치할 때만 허용한다', () => {
  const ownerA = 'user-a';
  const ownerB = 'user-b';
  assert.equal(storedOwnerMatches({ owner_id: ownerA }, 'owner_id', ownerA), true);
  assert.equal(storedOwnerMatches({ owner_id: ownerB }, 'owner_id', ownerA), false);
  assert.equal(storedOwnerMatches({ instructor_id: ownerB }, 'instructor_id', ownerA), false);
  assert.equal(storedOwnerMatches({ instructor_id: ownerA }, 'instructor_id', ownerA), true);
});

test('자기 목록 별칭은 GET만 열고 기존 CRUD 경로와 분리된다', async () => {
  const response = {
    headers: new Map(),
    setHeader(name, value) { this.headers.set(name, value); },
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
  };
  await myNotesHandler({ method: 'POST' }, response);
  assert.equal(response.code, 405);
  assert.equal(response.headers.get('Allow'), 'GET');
  assert.equal(response.body.error, 'METHOD_NOT_ALLOWED');
});
