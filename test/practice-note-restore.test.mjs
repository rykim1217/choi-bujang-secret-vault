import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  canRestorePracticeNote,
  contentSha256,
  PRACTICE_NOTE_ID,
  PRACTICE_OWNER_ID,
  readVerifiedPracticeCopy,
  RESTORE_ROUTE,
} from '../src/practice-note-restore.mjs';
import restoreHandler from '../api/restore/notes/[id].js';

test('실습용 B 메모 사본은 ID·소유자·내용 해시가 검증된다', () => {
  const copy = readVerifiedPracticeCopy();
  assert.equal(copy.id, PRACTICE_NOTE_ID);
  assert.equal(copy.ownerId, PRACTICE_OWNER_ID);
  assert.equal(copy.contentSha256, contentSha256(copy));
  assert.equal(copy.source.historicalOperationalBackup, false);
});

test('복원 권한은 검증된 학생 B에게만 부여된다', () => {
  const copy = readVerifiedPracticeCopy();
  assert.equal(canRestorePracticeNote({ kind: 'student', userId: PRACTICE_OWNER_ID }, copy), true);
  assert.equal(canRestorePracticeNote({ kind: 'student', userId: 'b0000000-0000-4000-8000-000000000003' }, copy), false);
  assert.equal(canRestorePracticeNote({ kind: 'judge', userId: PRACTICE_OWNER_ID }, copy), false);
});

test('복원 경로는 POST 경로이며 다른 메서드는 쓰기 전에 거부된다', async () => {
  assert.equal(RESTORE_ROUTE, 'POST /api/restore/notes/:id');
  const response = {
    headers: new Map(),
    setHeader(name, value) { this.headers.set(name, value); },
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
  };
  await restoreHandler({ method: 'GET' }, response);
  assert.equal(response.code, 405);
  assert.equal(response.body.error, 'METHOD_NOT_ALLOWED');
});
