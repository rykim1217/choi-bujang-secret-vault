import { formatNote, getAuthenticatedContext } from '../notes.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

function parseBody(request) {
  if (request.body && typeof request.body === 'object') return request.body;
  if (typeof request.body !== 'string') return null;
  try { return JSON.parse(request.body); } catch { return null; }
}

function routeId(request) {
  const id = request.query?.id;
  return Array.isArray(id) ? id[0] : id;
}

function validText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  if (!['GET', 'PUT', 'DELETE'].includes(request.method)) {
    response.setHeader('Allow', 'GET, PUT, DELETE');
    return response.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  const id = routeId(request);
  if (typeof id !== 'string' || !UUID.test(id)) {
    return response.status(400).json({ error: 'INVALID_NOTE_ID' });
  }

  const context = await getAuthenticatedContext(request, response);
  if (!context) return;

  if (request.method === 'GET') {
    const { data, error } = await context.supabase
      .from('vault_notes')
      .select('id, title, content')
      .eq('id', id)
      .eq('owner_id', context.principal.userId)
      .maybeSingle();
    if (error) return response.status(502).json({ error: 'NOTE_LOOKUP_FAILED' });
    if (!data) return response.status(404).json({ error: 'NOTE_NOT_FOUND' });
    return response.status(200).json(formatNote(data));
  }

  if (request.method === 'PUT') {
    const input = parseBody(request);
    if (!input || !validText(input.title) || !validText(input.body)) {
      return response.status(400).json({ error: 'INVALID_NOTE' });
    }

    const { data: existing, error: existingError } = await context.supabase
      .from('vault_notes')
      .select('id, owner_id')
      .eq('id', id)
      .maybeSingle();
    if (existingError) return response.status(502).json({ error: 'NOTE_LOOKUP_FAILED' });
    if (!existing || existing.owner_id !== context.principal.userId) {
      return response.status(404).json({ error: 'NOTE_NOT_FOUND' });
    }

    const { data, error } = await context.supabase
      .from('vault_notes')
      .update({
        title: input.title,
        content: input.body,
        owner_id: context.principal.userId,
      })
      .eq('id', id)
      .eq('owner_id', context.principal.userId)
      .select('id, title, content, owner_id')
      .maybeSingle();
    if (error) return response.status(502).json({ error: 'NOTE_UPDATE_FAILED' });
    if (!data || data.owner_id !== context.principal.userId) {
      return response.status(404).json({ error: 'NOTE_NOT_FOUND' });
    }
    return response.status(200).json(formatNote(data));
  }

  const { data, error } = await context.supabase
    .from('vault_notes')
    .delete()
    .eq('id', id)
    .eq('owner_id', context.principal.userId)
    .select('id')
    .maybeSingle();
  if (error) return response.status(502).json({ error: 'NOTE_DELETE_FAILED' });
  if (!data) return response.status(404).json({ error: 'NOTE_NOT_FOUND' });
  return response.status(200).json({ id: data.id });
}
