import { getAuthenticatedContext, requireApprovedDevice, requireSameOrigin } from '../../notes.js';
import { storedOwnerMatches } from '../../../src/resource-access.mjs';
import {
  canRestorePracticeNote,
  contentSha256,
  PRACTICE_NOTE_ID,
  readVerifiedPracticeCopy,
  restoreCopyResponse,
  RESTORE_ROUTE,
} from '../../../src/practice-note-restore.mjs';

function routeId(request) {
  const id = request.query?.id;
  return Array.isArray(id) ? id[0] : id;
}

function hasBody(request) {
  if (request.body === undefined || request.body === null || request.body === '') return false;
  if (typeof request.body === 'object') return Object.keys(request.body).length > 0;
  if (typeof request.body !== 'string') return true;
  try {
    const parsed = JSON.parse(request.body);
    return !parsed || typeof parsed !== 'object' || Array.isArray(parsed)
      || Object.keys(parsed).length > 0;
  } catch {
    return true;
  }
}

export { RESTORE_ROUTE };

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Allow', 'POST');

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }
  if (!requireSameOrigin(request, response)) return;

  let copy;
  try {
    copy = readVerifiedPracticeCopy();
  } catch {
    return response.status(503).json({ error: 'RESTORE_SOURCE_UNAVAILABLE' });
  }

  if (routeId(request) !== PRACTICE_NOTE_ID || hasBody(request)) {
    return response.status(400).json({ error: 'RESTORE_TARGET_NOT_ALLOWED' });
  }

  const context = await getAuthenticatedContext(request, response);
  if (!context) return;
  if (!await requireApprovedDevice(request, response, context)) return;
  if (!canRestorePracticeNote(context.principal, copy)) {
    return response.status(403).json({ error: 'RESTORE_FORBIDDEN' });
  }

  const { data: existing, error: lookupError } = await context.supabase
    .from('vault_notes')
    .select('id, owner_id')
    .eq('id', copy.id)
    .maybeSingle();
  if (lookupError) return response.status(502).json({ error: 'RESTORE_LOOKUP_FAILED' });
  if (existing && !storedOwnerMatches(existing, 'owner_id', copy.ownerId)) {
    return response.status(409).json({ error: 'RESTORE_TARGET_CONFLICT' });
  }

  const query = existing
    ? context.supabase.from('vault_notes')
      .update({ title: copy.title, content: copy.content, owner_id: copy.ownerId })
      .eq('id', copy.id).eq('owner_id', copy.ownerId)
    : context.supabase.from('vault_notes')
      .insert({ id: copy.id, owner_id: copy.ownerId, title: copy.title, content: copy.content });
  const { data, error } = await query
    .select('id, owner_id, title, content')
    .maybeSingle();
  if (error) return response.status(502).json({ error: 'RESTORE_WRITE_FAILED' });
  if (!data || data.id !== copy.id
      || !storedOwnerMatches(data, 'owner_id', copy.ownerId)
      || contentSha256({ title: data.title, content: data.content }) !== copy.contentSha256) {
    return response.status(502).json({ error: 'RESTORE_VERIFY_FAILED' });
  }

  return response.status(existing ? 200 : 201).json(restoreCopyResponse(copy));
}
