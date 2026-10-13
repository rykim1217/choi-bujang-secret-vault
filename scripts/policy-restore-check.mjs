import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { decide } from '../src/decider.mjs';
import { storedOwnerMatches } from '../src/resource-access.mjs';

const phase = process.argv.includes('--post-restore') ? 'post_restore' : 'pre_restore_fixture';
const emptyHash = createHash('sha256').update('').digest('hex');

function request(subjectId) {
  return {
    schema: 'aleph.decision.v1',
    requestId: randomUUID(),
    classId: 'class_fixture',
    projectId: 'project_fixture',
    subjectId,
    deviceId: 'abcdef0123456789',
    service: 'notes',
    method: 'GET',
    path: '/api/notes/opaque-note-a',
    route: 'GET /api/notes/:id',
    queryLength: 0,
    querySha256: emptyHash,
    at: '2026-10-01T00:00:00.000Z',
    policyRevision: 9,
    deviceRegistered: true,
    stepUp: { verified: false, authAgeSeconds: null },
    recentEvents: [],
    signals: { source: 'none', region: 'unknown', network: 'unknown', hour: 14 },
  };
}

const recordOwnedByA = { id: 'opaque-note-a', owner_id: 'owner-a' };
const aOwnerCheck = storedOwnerMatches(recordOwnedByA, 'owner_id', 'owner-a');
const bOwnerCheck = storedOwnerMatches(recordOwnedByA, 'owner_id', 'owner-b');
const aResponse = await decide(request('owner-a'));

assert.equal(aOwnerCheck, true);
assert.equal(bOwnerCheck, false);
assert.equal(aResponse.decision, 'allow');

process.stdout.write(`${JSON.stringify({
  phase,
  localPracticeOnly: true,
  aNormalRequest: { decision: aResponse.decision, ownerCheck: 'allow' },
  bRequestForARecord: { ownerCheck: 'deny' },
  liveApiExecuted: false,
  liveSupabaseExecuted: false,
}, null, 2)}\n`);
