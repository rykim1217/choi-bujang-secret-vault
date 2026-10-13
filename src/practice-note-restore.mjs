import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const COPY_MANIFEST_URL = new URL('../practice-restore/manifest.json', import.meta.url);
const COPY_NOTE_URL = new URL('../practice-restore/notes/note-b.json', import.meta.url);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export const RESTORE_SERVICE = 'note_restore';
export const RESTORE_ROUTE = 'POST /api/restore/notes/:id';
export const PRACTICE_NOTE_ID = 'b0000000-0000-4000-8000-000000000001';
export const PRACTICE_OWNER_ID = 'b0000000-0000-4000-8000-000000000002';

function canonicalContent({ title, content } = {}) {
  return JSON.stringify({ title, content });
}

export function contentSha256(note) {
  return createHash('sha256').update(canonicalContent(note), 'utf8').digest('hex');
}

function parseJson(url) {
  return JSON.parse(readFileSync(url, 'utf8'));
}

export function readVerifiedPracticeCopy() {
  const manifest = parseJson(COPY_MANIFEST_URL);
  const note = parseJson(COPY_NOTE_URL);
  if (manifest?.schema !== 'aleph.practice.note-restore.v1'
      || manifest.purpose !== 'training_only' || manifest.status !== 'candidate'
      || manifest.source?.type !== 'synthetic_fixture'
      || manifest.source?.historicalOperationalBackup !== false
      || manifest.snapshotPath !== 'notes/note-b.json') {
    throw new Error('restore_copy_manifest_invalid');
  }
  if (!UUID.test(note?.id ?? '') || !UUID.test(note?.ownerId ?? '')
      || note.id !== PRACTICE_NOTE_ID || note.ownerId !== PRACTICE_OWNER_ID
      || manifest.target?.id !== PRACTICE_NOTE_ID
      || manifest.target?.ownerId !== PRACTICE_OWNER_ID
      || typeof note.title !== 'string' || !note.title.trim()
      || typeof note.content !== 'string' || !note.content.trim()
      || manifest.target?.canonicalization !== 'UTF-8 JSON.stringify({title,content})') {
    throw new Error('restore_copy_target_invalid');
  }
  const actualHash = contentSha256(note);
  if (manifest.target.contentSha256 !== actualHash) {
    throw new Error('restore_copy_hash_mismatch');
  }
  return Object.freeze({
    id: note.id,
    ownerId: note.ownerId,
    title: note.title,
    content: note.content,
    contentSha256: actualHash,
    createdAt: manifest.createdAt,
    source: manifest.source,
  });
}

export function canRestorePracticeNote(principal, copy = readVerifiedPracticeCopy()) {
  return principal?.kind === 'student' && principal.userId === copy.ownerId;
}

export function restoreCopyResponse(copy) {
  return {
    service: RESTORE_SERVICE,
    route: RESTORE_ROUTE,
    restored: {
      id: copy.id,
      ownerId: copy.ownerId,
      contentSha256: copy.contentSha256,
    },
    source: {
      type: copy.source.type,
      createdAt: copy.createdAt,
      historicalOperationalBackup: false,
    },
  };
}
