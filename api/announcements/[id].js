import { getAuthenticatedContext, requireApprovedDevice, requireSameOrigin } from '../notes.js';
import { formatResource, RESOURCE_IDS } from '../../src/resource-policy.mjs';
import { storedOwnerMatches } from '../../src/resource-access.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

function routeId(request) {
  const id = request.query?.id;
  return Array.isArray(id) ? id[0] : id;
}

function parseBody(request) {
  if (request.body && typeof request.body === 'object') return request.body;
  if (typeof request.body !== 'string') return null;
  try { return JSON.parse(request.body); } catch { return null; }
}

function validText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function formatAnnouncement(announcement) {
  return formatResource(RESOURCE_IDS.instructorAnnouncements, {
    id: announcement.id,
    title: announcement.title,
    body: announcement.content,
  });
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'PUT') {
    response.setHeader('Allow', 'PUT');
    return response.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }
  if (!requireSameOrigin(request, response)) return;

  const id = routeId(request);
  if (typeof id !== 'string' || !UUID.test(id)) {
    return response.status(400).json({ error: 'INVALID_ANNOUNCEMENT_ID' });
  }

  const context = await getAuthenticatedContext(request, response);
  if (!context) return;
  if (!await requireApprovedDevice(request, response, context)) return;
  const input = parseBody(request);
  if (!input || !validText(input.title) || !validText(input.body)) {
    return response.status(400).json({ error: 'INVALID_ANNOUNCEMENT' });
  }

  const { data: existing, error: existingError } = await context.supabase
    .from('vault_announcements')
    .select('id, instructor_id')
    .eq('id', id)
    .eq('instructor_id', context.principal.userId)
    .maybeSingle();
  if (existingError) return response.status(502).json({ error: 'ANNOUNCEMENT_LOOKUP_FAILED' });
  if (!storedOwnerMatches(existing, 'instructor_id', context.principal.userId)) {
    return response.status(403).json({ error: 'ANNOUNCEMENT_FORBIDDEN' });
  }

  const { data, error } = await context.supabase
    .from('vault_announcements')
    .update({ title: input.title, content: input.body, instructor_id: context.principal.userId })
    .eq('id', id)
    .eq('instructor_id', context.principal.userId)
    .select('id, title, content, instructor_id')
    .maybeSingle();
  if (error) return response.status(502).json({ error: 'ANNOUNCEMENT_UPDATE_FAILED' });
  if (!storedOwnerMatches(data, 'instructor_id', context.principal.userId)) {
    return response.status(403).json({ error: 'ANNOUNCEMENT_FORBIDDEN' });
  }
  return response.status(200).json(formatAnnouncement(data));
}
